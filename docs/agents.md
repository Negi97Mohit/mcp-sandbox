# 🧠 Agents — How Each Agent Works

Gaki uses **four specialized AI agents**, each with a distinct role, limited toolset, and structured output format. No single agent can do everything on its own — that's by design.

---

## 1. Orchestrator

**File**: [`src/agents/orchestrator.ts`](../src/agents/orchestrator.ts)

### In Plain English
The Orchestrator is the project manager. It doesn't write code itself — it delegates. It receives your request, coordinates the three worker agents in sequence, watches the results, and decides what to do next: auto-commit, ask for approval, or escalate to you.

### What It Does Technically
- Generates a unique `taskId` (`task-{timestamp}-{random}`) for every run
- Starts a distributed trace via `tracer.startTrace()`
- Calls agents in pipeline order: `PlannerAgent → ImplementerAgent → VerifierAgent`
- After each phase, checks for failure or explicit `ESCALATE:` signals
- Applies confidence thresholds to decide the final action
- Calls the `approvalGate` before any high-risk action (like creating a PR)
- Logs every phase update to Discord via `context.sendLog()`

### Decision Thresholds

```typescript
const AUTO_COMMIT_THRESHOLD = 0.85;   // >= 0.85 AND all tests pass → auto PR
const APPROVAL_THRESHOLD    = 0.60;   // >= 0.60 → show diff, ask human
                                      //  < 0.60 → escalate, explain failure
```

### Early Exit Conditions
The Orchestrator exits early (without reaching verification) if:
- PlannerAgent fails or returns confidence < 0.3
- ImplementerAgent fails or outputs `ESCALATE: [reason]`

### Output: `OrchestratorResult`

```typescript
{
  taskId: string;
  originalRequest: string;
  decision: {
    action: "auto_commit" | "request_approval" | "escalate" | "abort";
    reason?: string;       // for escalate/abort
    diff?: string;         // for request_approval
    prTitle?: string;      // for auto_commit
    prBody?: string;       // for auto_commit
  };
  planResult?: AgentResult;
  implementResult?: AgentResult;
  verifyResult?: AgentResult;
  totalLatencyMs: number;
  traceId?: string;
}
```

---

## 2. PlannerAgent

**File**: [`src/agents/plannerAgent.ts`](../src/agents/plannerAgent.ts)

### In Plain English
The Planner is a senior engineer who reads the codebase and writes a detailed, numbered action plan. It never touches a file — it only reads. Think of it as the person who does the design doc before anyone writes a single line of code.

### Allowed Tools
```
run_shell      → git log, git diff, grep (read-only shell commands)
read_file      → read any file in the workspace
list_files     → list directory contents
find_git_repos → discover Git repositories on disk
```

> **Why read-only?** If the Planner could write files, it might accidentally make changes while still in "analysis mode," before a human has a chance to review the plan.

### Output Format (Structured)
The Planner is required to output its response in this exact format:
```
PLAN:
1. [Step description] — Tool: [tool_name], File: [filename or N/A]
2. [Step description] — Tool: [tool_name], File: [filename or N/A]
...
CONFIDENCE: [0.0–1.0]
REASON: [Why you're confident/uncertain]
```

### How the Plan Gets Parsed
`plannerAgent.ts` uses regex to extract structured `PlanStep[]` from the LLM's free-text output:
```typescript
private parsePlan(output: string): PlanStep[] {
  // Extracts numbered lines between "PLAN:" and "CONFIDENCE:"
  // Each step becomes: { stepNumber, description, toolToUse?, expectedOutput? }
}

private parseConfidence(output: string): number {
  // Extracts the float after "CONFIDENCE:" and clamps it to [0.0, 1.0]
}
```

### Constraints
- Maximum 8 plan steps
- Must be specific ("Edit `src/auth/login.ts` line 42" not "fix the bug")
- If uncertain → must output `CONFIDENCE: 0.3` or lower with an explanation

---

## 3. ImplementerAgent

**File**: [`src/agents/implementerAgent.ts`](../src/agents/implementerAgent.ts)

### In Plain English
The Implementer is the developer who takes the plan and actually executes it. It writes files, runs commands, and stages changes in Git. It works exactly as a real developer would: follow the steps in order, check results, and stop if something breaks.

### Allowed Tools
```
run_shell         → run any shell command (npm, git add, etc.)
read_file         → verify a file was written correctly
write_file        → create or edit files
list_files        → inspect directory structure
github_read_file  → read files from a GitHub repo via API
```

### What It Can NOT Do
- `git push` — explicitly blocked in system prompt
- `git merge` or `git force-push` — explicitly blocked
- `rm -rf` — explicitly blocked
- Create PRs — only the Orchestrator can trigger that

If the Implementer hits something it can't handle safely, it outputs:
```
ESCALATE: [reason]
```
The Orchestrator detects this and immediately stops, escalating to the human.

### The Plan Is Injected Into Its System Prompt
The Planner's output (`PlanStep[]`) is formatted and injected directly into the Implementer's system prompt:
```
## Execution Plan
Step 1: Read src/auth/login.ts to understand current logic [read_file]
Step 2: Fix the session token expiry check on line 42 [write_file]
Step 3: Run npm run build to verify no compile errors [run_shell]
```

### Output Format (Parsed by Orchestrator)
```
IMPLEMENTATION_STATUS: success | partial | failed
FILES_MODIFIED: [src/auth/login.ts, src/auth/types.ts]
NOTES: [anything the Verifier should know]
```

After each run, modified files are extracted:
```typescript
private parseModifiedFiles(output: string): string[] {
  // Regex extracts the comma-separated list from FILES_MODIFIED: [...]
}
```

---

## 4. VerifierAgent

**File**: [`src/agents/verifierAgent.ts`](../src/agents/verifierAgent.ts)

### In Plain English
The Verifier is the QA engineer. After the Implementer finishes, the Verifier runs the full test suite, checks types, runs lint — and then gives an honest confidence score. The key insight here: **the score is based on actual test results, not LLM guessing**. The LLM interprets the output but the numbers come from real pass/fail counts.

### Allowed Tools
```
run_shell  → npm run build, npm test, npm run lint
read_file  → smoke-check that modified files look correct
list_files → find test files if needed
```

### Verification Order
Runs checks in this exact sequence (stops and reports on critical failure):
1. **Type Check** — `npm run build` or `tsc --noEmit`
2. **Lint** — `npm run lint` (skips gracefully if not configured)
3. **Tests** — `npm test` or `npm run test -- --passWithNoTests`
4. **Logic Review** — reads modified files and checks the change makes sense

### Output Format (Structured)
```
VERIFICATION_SUMMARY:
- TypeCheck: pass — compiled successfully
- Lint:      pass — no warnings
- Tests:     12/12 passing — all auth tests green
- LogicReview: pass — token expiry now correctly checks UTC time

CONFIDENCE: 0.92
CONFIDENCE_REASON: All 12 tests pass and type check is clean.
TEST_COMMAND: npm test
TOTAL_TESTS: 12
PASSING_TESTS: 12
FAILING_TESTS: 0
```

### Score Rules
| Situation | Confidence |
|---|---|
| TypeScript compile error | 0.0 (hard fail) |
| All tests passing | High (0.80–1.0) |
| Some tests failing | Lower (0.40–0.75) |
| No test suite found | 0.6 (neutral, requires human review) |

The parsed results feed directly into the Orchestrator's decision logic:
```typescript
const confidence = verifyResult.confidence ?? 0.5;
const testsOk    = (verifyResult.testResults?.failing ?? 0) === 0;
```

---

## 5. BaseAgent (Shared Foundation)

**File**: [`src/agents/baseAgent.ts`](../src/agents/baseAgent.ts)

All worker agents (`Planner`, `Implementer`, `Verifier`) extend `BaseAgent`. It provides:

### The Agentic Loop
```typescript
async run(input: AgentInput): Promise<AgentResult> {
  let history = [systemPrompt, ...input.history];
  
  for (let step = 0; step < MAX_STEPS; step++) {
    const message = await llm.call(history, allowedTools);
    history.push(message);
    
    if (!message.tool_calls) break;  // LLM is done, no more tools
    
    // Duplicate detection — same tool + same args 3 times = abort
    if (this.isDuplicateCall(message.tool_calls)) {
      throw new Error("Infinite loop detected");
    }
    
    // Execute each tool call
    for (const toolCall of message.tool_calls) {
      const result = await executeToolCall(toolCall.name, toolCall.args);
      history.push({ role: "tool", content: result });
    }
  }
  
  return this.buildResult(history);
}
```

### Loop Protection
- **Max steps**: 10 per agent run (configurable)
- **Duplicate detection**: tracks last 3 tool calls; if identical call is made 3 times with the same args and same error → abort with `"Infinite loop detected"`
- **History window**: only last 10 turns kept in context to prevent drift

### How Allowed Tools Are Enforced
Each agent implements `allowedTools(): string[]`. The BaseAgent filters the global tool registry:
```typescript
const tools = getAllTools().filter(t => 
  this.allowedTools().includes(t.function.name)
);
```
If the LLM somehow calls a tool not in its allowed list, `executeToolCall()` returns `{ error: "Tool X not found" }`.

---

## 6. ExplainerAgent

**File**: [`src/agents/explainerAgent.ts`](../src/agents/explainerAgent.ts)

Used by the **Custom Tools Studio** in the desktop UI. Given a tool's source code, it generates a structured Markdown guide explaining:
- What the tool does
- All parameters with types and descriptions
- Return schema
- Example usage from the terminal or Discord

### When It's Triggered
Clicking the ✨ Sparkles icon next to any tool in the desktop UI opens the Explainer drawer.

---

## 7. GeneratorAgent

**File**: [`src/agents/generatorAgent.ts`](../src/agents/generatorAgent.ts)

Used by the **AI Tool Generator Form** in the desktop UI. Given:
- Tool name
- Input parameters (names, types, descriptions, required flags)
- API URL to call
- Expected response structure

It generates a valid, schema-compliant JavaScript handler that can be immediately registered as a custom tool.
