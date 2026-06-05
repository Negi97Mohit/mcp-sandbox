# 🛡️ Safety, Security & Reliability

This document explains how Gaki prevents common failure modes in AI agent systems — hallucinations, infinite loops, scope creep, and unauthorized access.

---

## 1. Hallucination Prevention

### The Problem
LLMs sometimes "invent" functions, libraries, or API endpoints that don't exist — and then confidently use them. A naive agent would call a non-existent tool and silently fail.

### How Gaki Handles It

**Tool Registry Validation**

Every tool call is validated against the registered tool list before execution:
```typescript
// From src/tools/index.ts
export async function executeToolCall(name: string, args: any, context?: ToolContext) {
  if (shellTools.some(t => t.function.name === name)) { ... }
  if (fileTools.some(t => t.function.name === name)) { ... }
  // ...
  return { error: `Tool ${name} not found` };  // ← Explicit rejection
}
```

When an agent calls `run_database_query` and that tool doesn't exist, it gets back `{ error: "Tool run_database_query not found" }`. This error goes into the LLM's history, forcing it to reassess and use real tools.

**Compiler Gates**

If the ImplementerAgent writes code using a fabricated library or type:
```typescript
// Agent hallucinated this function:
import { magicFix } from 'some-made-up-library';
```

The VerifierAgent runs `tsc --noEmit` and gets:
```
error TS2307: Cannot find module 'some-made-up-library'
```

This causes `CONFIDENCE: 0.0` → the Orchestrator escalates instead of creating a PR with broken code.

**Structured Output Enforcement**

Agents are required to output machine-parseable formats. The Orchestrator ignores free-form explanations and only acts on parsed values:
- `CONFIDENCE: 0.85` — parsed by regex
- `FILES_MODIFIED: [src/auth.ts]` — parsed by regex
- `TOTAL_TESTS: 12` — parsed by regex

If the LLM produces something like `"I'm about 85% confident"` in prose, the parser returns `0.5` (neutral default) — preventing overconfident decisions based on unstructured text.

---

## 2. Infinite Loop Prevention

### The Problem
An agent might repeatedly try the same failing command — e.g., trying to write a file, getting a permission error, and retrying the exact same write forever.

### How Gaki Handles It

**Max Step Counter**

Every agent run is capped at **10 steps**. After 10 tool calls without a final answer, the loop terminates:
```typescript
// From src/agents/baseAgent.ts
const MAX_STEPS = 10;

for (let step = 0; step < MAX_STEPS; step++) {
  // ... tool call loop
}
// If we reach here: force-terminate and escalate
```

**Duplicate Tool Call Detection**

The last 3 tool calls are tracked. If the agent calls the same tool with identical arguments 3 times in a row:
```
Step 7: write_file("src/auth.ts", "...content...")  → { error: "Permission denied" }
Step 8: write_file("src/auth.ts", "...content...")  → { error: "Permission denied" }
Step 9: write_file("src/auth.ts", "...content...")  → LOOP DETECTED
```

The loop is aborted and reported:
```
"Infinite loop detected: Tool write_file called repeatedly with identical parameters. Aborting."
```

---

## 3. Scope Creep Prevention

### The Problem
Agents sometimes go beyond the requested task — "I was asked to fix a typo but also refactored 5 other files while I was there."

### How Gaki Handles It

**Implementer Prompt Constraints**
```
Your changes should be clean, minimal, and exactly what was planned — no scope creep.
After each file change, verify it with read_file.
Do NOT run: git push, git merge, git force-push, rm -rf.
```

**Plan-Bounded Execution**

The Implementer receives the Planner's explicit `PlanStep[]` and is instructed to follow them in order. Deviation is caught by the Verifier, which reads the modified files and checks logical consistency.

**Git Staging Instead of Committing**

The Implementer only runs `git add -A`. The actual commit and PR creation only happen after:
1. Verifier confidence ≥ threshold
2. Human approval (for high-risk actions)

This means there's always a window to review before anything is permanent.

---

## 4. Context Drift Prevention

### The Problem
In long agent runs, the LLM's context window fills up with tool outputs. Eventually it "forgets" its system rules and starts behaving erratically.

### How Gaki Handles It

**Sliding History Window**

Only the last 10 conversation turns are kept in the LLM's message history:
```typescript
// Older messages are dropped, keeping the window focused
const historyWindow = history.slice(-10);
```

**System Prompt Re-injection**

The system prompt (with all constraints, workspace info, and allowed tools) is prepended to **every single API call** — not just the first one. Even in turn 10, the LLM sees its full instructions.

**State Externalized to Files**

Key state isn't held in conversation history — it's written to disk:
- `implementation_plan.md` — the plan (survives context resets)
- `task.md` — task progress tracking
- `action_logs/` — persisted action history

If context resets, the agent can re-read these files and continue.

---

## 5. Path Traversal Protection

### The Problem
An agent (or malicious user) might try to access system files: `read_file("../../../etc/passwd")`.

### How Gaki Handles It

**Sandboxed Workspace Enforcement**

For non-admin users, every file operation resolves the path and checks it stays within the workspace root:
```typescript
// From src/tools/shell.ts — cd command handler
if (context?.workspaceRoot && !target.startsWith(context.workspaceRoot)) {
  return { error: "Access Denied: You cannot navigate outside your workspace." };
}
```

The same check exists in `write_file` and `read_file`. An absolute path like `/etc/passwd` resolves to something outside `workspaces/ws-user-id/` and is rejected.

**Eval Suite Security Tests**

Two of the 20 eval test cases specifically test path traversal:
```
✅ security.traversal1  — cd ../../../etc/passwd → Access Denied
✅ security.traversal2  — write_file /etc/hosts  → Access Denied
```

These tests run on every `npm run eval` to catch regressions.

---

## 6. Approval Gate — Detailed Flow

### Trigger Conditions
The gate is triggered for:
- Creating a GitHub PR
- Deploying to Netlify
- Any action classified as `high` or `critical` by `riskClassifier`

### Flow

```
High-risk action identified
          │
          ▼
approvalGate.request({
  id, channelId, requestedBy,
  action, reason, riskLevel,
  context, timeoutMs: 300000
})
          │
          ▼
Discord embed sent with ✅/❌ reactions
          │
          ▼
Wait for reaction (up to 5 min)
          │
    ┌─────┴─────┐
    ✅          ❌ or timeout
    │                │
proceed          rollback:
                 git checkout --
                 staged files cleared
                 user notified
```

### Who Can Approve
Only the user who triggered the request (`requestedBy` field) can approve. Other users reacting are ignored.

---

## 7. Firebase Security

The `service-account.json` file grants admin access to Firebase. It must never be committed to version control.

The `.gitignore` file includes:
```
service-account.json
.env
```

If you accidentally commit either file, rotate your Firebase service account and API keys immediately.

---

## 8. API Key Security

- API keys are stored only in `.env` (never hardcoded)
- `.env` is in `.gitignore`
- Hot-reload means keys can be rotated without restarting
- The desktop UI shows keys as masked (`sk-or-v1-••••••••`) with a toggle to reveal

---

## Summary: What Gaki Can and Cannot Do

### Gaki CAN
- Read any file in the workspace
- Write files and create directories
- Run shell commands
- Stage Git changes
- Create GitHub PRs (with human approval)
- Deploy to Netlify (with human approval)
- Create and delete custom tools (admin only)

### Gaki CANNOT (by design)
- `git push` directly (blocked in agent prompts)
- `git merge` or force-push (blocked in agent prompts)
- `rm -rf` system directories (blocked + sandboxed)
- Navigate outside the user's workspace sandbox
- Execute arbitrary code without going through the tool registry
- Approve its own high-risk actions (humans always in the loop)
