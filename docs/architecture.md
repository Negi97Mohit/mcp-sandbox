# 🏗️ Architecture — Technical Deep Dive

## System Overview

Gaki is built around a **Supervisor-Worker multi-agent topology**. Instead of a single all-knowing agent that tries to do everything (and often goes off the rails), the work is divided across specialist agents, each with constrained permissions and a single responsibility.

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                            │
│            (Discord DM / Desktop UI / CLI)                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                             │
│  • Generates a unique taskId                                    │
│  • Starts a distributed trace (tracer.startTrace)               │
│  • Classifies risk level (riskClassifier)                       │
│  • Runs agents sequentially: Plan → Implement → Verify          │
│  • Applies decision logic based on confidence score             │
└────────────┬──────────────────┬───────────────────┬────────────┘
             │                  │                   │
             ▼                  ▼                   ▼
    ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ PlannerAgent │  │ ImplementerAgent │  │  VerifierAgent   │
    │  (Read-Only) │  │ (Read + Write)   │  │ (Execute-Only)   │
    │              │  │                  │  │                  │
    │ Tools:       │  │ Tools:           │  │ Tools:           │
    │ run_shell    │  │ run_shell        │  │ run_shell        │
    │ read_file    │  │ read_file        │  │ read_file        │
    │ list_files   │  │ write_file       │  │ list_files       │
    │ find_git_    │  │ list_files       │  │                  │
    │   repos      │  │ github_read_file │  │ Scores: 0.0-1.0  │
    └──────────────┘  └──────────────────┘  └──────────────────┘
             │                  │                   │
             └──────────────────┴───────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DECISION ENGINE                           │
│  confidence >= 0.85 AND all tests pass  →  auto_commit (PR)     │
│  confidence >= 0.60                     →  request_approval     │
│  confidence <  0.60                     →  escalate             │
│  ESCALATE: signal from Implementer      →  immediate escalation │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HUMAN-IN-THE-LOOP GATE                        │
│  High/Critical risk actions → pause execution                   │
│  → Send Discord embed with ✅/❌ reaction buttons               │
│  → Wait up to 5 minutes for human response                      │
│  → Auto-reject and rollback if no response                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure (Annotated)

```
mcp-sandbox/
│
├── index.ts                  # Standalone entry: Discord bot + hot-reload watcher
├── verify_sandbox.ts         # Run sandbox health checks
├── check_models.ts           # Validate API keys and model connectivity
│
├── src/
│   ├── agents/               # All AI agent classes
│   │   ├── orchestrator.ts   # Master coordinator — the "brain"
│   │   ├── plannerAgent.ts   # Read-only code inspector + step planner
│   │   ├── implementerAgent.ts  # Code writer + file editor
│   │   ├── verifierAgent.ts  # Test runner + confidence scorer
│   │   ├── baseAgent.ts      # Shared agent logic (LLM calls, tool loop, history)
│   │   ├── explainerAgent.ts # Explains tools in natural language
│   │   ├── generatorAgent.ts # Generates new tool code from a form input
│   │   └── agentTypes.ts     # TypeScript interfaces for agent I/O
│   │
│   ├── tools/                # All tool implementations
│   │   ├── index.ts          # Central registry — routes tool calls to handlers
│   │   ├── shell.ts          # run_shell — executes shell commands
│   │   ├── files.ts          # read_file, write_file, list_files, find_git_repos
│   │   ├── git.ts            # Git operations (stage, diff, log, branch)
│   │   ├── github.ts         # GitHub API (issues, PRs, file reads)
│   │   ├── netlify.ts        # Netlify deploy + site management
│   │   ├── netlifyMonitor.ts # Netlify build status monitoring
│   │   ├── project.ts        # Project scaffolding, dependency install
│   │   ├── search.ts         # Code search (grep-style)
│   │   └── toolManager.ts    # register/update/delete custom tools
│   │
│   ├── core/                 # Foundational system modules
│   │   ├── approvalGate.ts   # Human-in-the-loop pause + Discord reaction waiter
│   │   ├── riskClassifier.ts # Classifies action risk (low/medium/high/critical)
│   │   ├── PermissionManager.ts  # RBAC — reads/writes permissions.json
│   │   ├── CustomToolsEngine.ts  # Stores, loads, and executes custom JS tools
│   │   ├── WorkspaceStore.ts     # Tracks active workspace paths per session
│   │   ├── GraphStore.ts         # DAG of task nodes for visualization
│   │   └── WorkspaceManager.ts   # Provisions isolated sandboxes per user
│   │
│   ├── config/
│   │   └── env.ts            # Typed configuration singleton (reads from .env)
│   │
│   ├── discord/              # Discord bot event handlers and commands
│   ├── llm/                  # LLM client (OpenRouter API wrapper)
│   ├── tracing/              # Distributed tracing (spans + traces for observability)
│   ├── services/             # Background services (health monitoring, stats tracking)
│   ├── health/               # Health report generators, statsTracker.ts
│   ├── evals/                # Automated regression test suite (20 test cases)
│   ├── integrations/         # GitHub and external service clients
│   ├── adapters/             # LLM adapter configs (OpenRouter, OpenAI, etc.)
│   └── types/                # Shared TypeScript types (ToolContext, etc.)
│
├── electron/                 # Electron main process (desktop app shell)
├── desktop-ui/               # React + Vite frontend
│   └── src/
│       ├── pages/            # Dashboard, CustomTools, Settings pages
│       ├── components/       # DiffView, CopyButton, Charts
│       └── api/bridge.ts     # IPC bridge between React and Electron main process
│
├── workspaces/               # Auto-generated: isolated folders per Discord user
├── action_logs/              # Persisted logs of every agent action
├── eval_results/             # Stored evaluation results
├── traces/                   # Distributed trace files
├── stats/                    # Usage statistics JSON files
└── health_reports/           # Periodic health report snapshots
```

---

## Data Flow: A Single Request End-to-End

Here's exactly what happens when a user sends `!agent fix the auth bug`:

```
1. Discord message received → client.on("messageCreate")
2. Permission check → permissionManager.getRole(userId)
3. Workspace resolved → workspaceStore.getActivePath()
4. AgentContext built → { channelId, userId, repoOwner, repoName, sendLog }
5. orchestrator.run(request, context) called

6. [Phase 1 — Planning]
   → plannerAgent.run() starts
   → LLM sends tool calls: list_files, read_file, run_shell ("git log")
   → Each tool call → executeToolCall() → handler → result → back to LLM
   → LLM outputs structured PLAN + CONFIDENCE
   → planResult.plan = PlanStep[], planResult.confidence = 0.75

7. [Phase 2 — Implementation]
   → implementerAgent.run() starts with plan injected in system prompt
   → LLM sends tool calls: read_file, write_file, run_shell
   → Files modified on disk
   → git add -A staged
   → LLM outputs FILES_MODIFIED: [src/auth.ts]
   → implementResult.modifiedFiles = ["src/auth.ts"]

8. [Phase 3 — Verification]
   → verifierAgent.run() starts with modifiedFiles in context
   → LLM sends: run_shell("npm run build"), run_shell("npm test")
   → Parses test output → counts passing/failing
   → LLM outputs CONFIDENCE: 0.88, TOTAL_TESTS: 12, PASSING_TESTS: 12
   → verifyResult.confidence = 0.88, verifyResult.testResults = {...}

9. [Decision]
   → confidence (0.88) >= AUTO_COMMIT_THRESHOLD (0.85) AND testsOk → auto_commit
   → riskClassifier.classify("github_create_pr") → high risk
   → approvalGate.request() → Discord embed sent
   → User reacts ✅ → approval.outcome = "approved"
   → githubClient.createPR() → PR URL sent to Discord

10. [Tracing]
    → tracer.endTrace() → trace file saved to /traces/
    → graphStore nodes updated with final status
```

---

## LLM Integration

All agents share the same LLM client (`src/llm/`). The system routes through **OpenRouter**, which gives access to multiple model providers (OpenAI, Anthropic, Google, Nvidia, etc.) via one API.

### How the Agentic Loop Works

```
┌────────────────────────────────────────────┐
│  Build messages: [system, ...history]      │
└──────────────────┬─────────────────────────┘
                   │
                   ▼
              LLM API Call
                   │
         ┌─────────┴──────────┐
         │                    │
    tool_calls?           text content
         │                    │
         ▼                    ▼
  executeToolCall()      Done — return result
  → result pushed to
    history as "tool"
    message
         │
         ▼
   Loop again (max 10 steps)
         │
    Duplicate detection:
    same tool + same args
    3x in a row → abort
```

### Reasoning Support

When a model supports it (e.g., DeepSeek, Nvidia Nemotron), the system enables `reasoning: { enabled: true }` and preserves `reasoning_details` in the history so the model retains its chain-of-thought across tool call turns.

---

## Key Design Decisions

### Why 3 Separate Agents Instead of 1?

**Separation of concerns + permission isolation.**

The PlannerAgent only has `read` tools — it literally cannot modify anything even if it halts. The ImplementerAgent writes files but cannot push to Git. Only the Orchestrator (with human approval) creates PRs. This layered permission model prevents runaway agents from causing irreversible damage.

### Why Not Use a Framework (LangChain, etc.)?

Gaki uses a hand-rolled agentic loop (`baseAgent.ts`) for full control over:
- How history is managed (sliding window of last 10 turns)
- How reasoning_details are preserved across tool calls
- How duplicate detection and max-step limits work
- How tool schemas are defined and validated

### Why OpenRouter?

One API key → access to 200+ models. Easy to swap from one model to another in `.env` without touching code. Useful for cost optimization and fallback scenarios.

### How Is Drift Prevented?

Context drift (the LLM "forgetting" its rules in long runs) is mitigated by:
1. System prompt is **re-injected every single request** — not just the first one
2. **Sliding history window** of last 10 turns max
3. Structured output formats (PLAN:, CONFIDENCE:, FILES_MODIFIED:) force the LLM to produce machine-parseable artifacts instead of free-form text that might drift
