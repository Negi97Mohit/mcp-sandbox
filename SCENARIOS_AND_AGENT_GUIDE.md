# 🧠 Gaki Scenarios & Agent Engineering Guide

This document is structured in the first person (**"I/We"**) to serve as a direct script and reference manual for your technical interview questions.

---

## 📖 Table of Contents
1. [User Scenarios & Role Permissions](#1-user-scenarios--role-permissions)
2. [Orchestrator & Worker Agents Interaction](#2-orchestrator--worker-agents-interaction)
3. [Visualizations & System Observability](#3-visualizations--system-observability)
4. [Dynamic Agent Creation](#4-dynamic-agent-creation)
5. [Mitigating AI Faults, Hallucinations, Loops, and Drift](#5-mitigating-ai-faults-hallucinations-loops-and-drift)

---

## 1. User Scenarios & Role Permissions

### Q: How do different users interact with the system depending on their roles?
**A:** "We built a granular Role-Based Access Control (RBAC) database stored in [permissions.json](file:///C:/Users/Dell/Desktop/mohit/mcp-sandbox/permissions.json). We support three distinct tiers of users: **Admin**, **Write**, and **Read**."

*   **Scenario A: The Admin User**
    *   **Access level**: Full, system-wide system execution.
    *   **Workflow**: When I run commands as an Admin in the Discord Bot or the Electron App, the system bypasses directory isolation. The active directory defaults to `process.cwd()` (the main sandbox root).
    *   **Commands**: Only Admins can execute administrative controls such as:
        *   `!grant @user <read|write|admin>`: Grants specific permission levels.
        *   `!revoke @user`: Revokes access entirely.
        *   `!health`, `!history`, and `!stats`: Fetches live diagnostics and triggers system health charts.
        *   `!eval`: Runs the 20-case regression testing suite.

*   **Scenario B: The Read/Write User**
    *   **Access level**: Strictly sandboxed file-system access.
    *   **Workflow**: When a standard engineering user triggers a task, Gaki calls `ensureWorkspace(userId)`. This automatically spins up an isolated subdirectory inside the `workspaces/` folder.
    *   **Safety**: If the user asks the agent to run command lines or edit files, Gaki's shell execution engine validates that paths remain within their specific workspace folder. Attempts to write to root paths or system directories are blocked by our path traversal filters.

*   **Scenario C: Discord Bot vs. Desktop UI Interaction**
    *   **Discord Flow**: Users can mention the bot in a channel or Direct Message (DM). For simple tasks, the bot responds in-line. For complex tasks, users run `!agent <task>`. The bot streams live development step-logs and sends interactive buttons (like `✅` and `❌` reactions) to request authorization before modifying code.
    *   **Desktop App Flow**: Provides a visual glassmorphic dashboard. Users can edit environment variables directly, run local mock tests, configure tools, and review code side-by-side with a visual Git Diff before merging changes.

*   **Scenario D: User Without the App Workspace on their local PC**
    *   **Workflow**: If an engineer accesses the bot remotely and has no local files initialized, Gaki handles directory provisioning automatically. 
    *   **Cloning & Init**: The `WorkspaceManager` detects the missing workspace, creates a clean folder bound to their Discord ID, pulls their target GitHub repository via `simple-git`, builds the node modules, and allows the agent to edit and verify code remotely. All changes are then pushed back to GitHub as a Pull Request once approved.

---

## 2. Orchestrator & Worker Agents Interaction

### Q: How does Gaki's Orchestrator coordinate work across different agents?
**A:** "Instead of running a single agent loop that might get lost, we designed a **Supervisor-Worker (Orchestrator-Agent) topology**. Here is the exact lifecycle of a request:"

```
 ┌──────────────┐
 │ User Request │
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐      1. RISK CLASSIFICATION
 │ Orchestrator ├──────────────────────────────────────────┐
 └──────┬───────┘                                          │
        │                                                  ▼
        │ 2. ANALYSIS                               ┌──────────────┐
        ├───────────────────────────────────────────► PlannerAgent │ (Read-Only)
        │                                           └──────┬───────┘
        │                                                  │ Produces:
        │ 3. CODE MODIFICATION                             ▼ implementation_plan.md
        ├───────────────────────────────────────────► Implementer  │ (Write & Shell)
        │                                           └──────┬───────┘
        │                                                  │ Stages:
        │ 4. INTEGRITY CHECK                               ▼ Git Index Diffs
        ├───────────────────────────────────────────► VerifierAgent│ (Execute-Only)
        │                                           └──────┬───────┘
        │                                                  │ Compiles & scores
        ▼ 5. MERGE / ROLLBACK                              ▼ (0.0 - 1.0 confidence)
 ┌──────────────┐      Score >= 0.85 & Tests Pass ➜ Auto-PR
 │ Decision     ├──────────────────────────────────────────┘
 └──────────────┘      Score >= 0.60 ➜ Human Approval Gate
                       Score <  0.60 ➜ Rollback & Escalate
```

1.  **Risk Classification**: The Orchestrator inspects the request parameters. If it contains dangerous patterns, it flags it for human validation.
2.  **Planner Mode**: The Orchestrator invokes the `PlannerAgent` in a read-only context. The Planner inspects the workspace files and outputs a strict `implementation_plan.md` artifact.
3.  **Implementer Mode**: The `ImplementerAgent` reads the plan, updates the target files (like `src/auth.ts`), and runs local shell compile tests. It then stages the changes to the Git index.
4.  **Verifier Mode**: The `VerifierAgent` takes over in execute-only mode. It runs `npm run test` or standard compiler checks and rates the execution with a confidence score.
5.  **Decision Engine**: 
    *   If the score is **$\ge$ 0.85 and tests pass**, it commits and opens a PR.
    *   If the score is **$\ge$ 0.60**, it pauses and opens the Discord reaction gate or Git Diff drawer for manual approval.
    *   If the score is **< 0.60** or compiles fail, it issues a `git checkout` to restore the code state and reports the error.

---

## 3. Visualizations & System Observability

### Q: How do you visualize the system's performance and operations?
**A:** "We leverage visual modules inside both the Electron App and the Discord Bot to keep developers informed:"

1.  **Electron Dashboard Charts**: We built a dashboard using React and Recharts that parses the database tracked by [statsTracker.ts](file:///C:/Users/Dell/Desktop/mohit/mcp-sandbox/src/health/statsTracker.ts):
    *   **Pie Chart**: Breaks down the most utilized tools (e.g. `run_shell` vs `write_file`), exposing which operations are most frequently performed.
    *   **Line Chart**: Tracks agent response times, token latency, and error counts over a 7-day trailing window.
2.  **Git Diff Visualization**: In the Custom Tools modify drawer, we render a side-by-side colorized Diff view. Green lines display new code additions, red displays deletions, and grey displays surrounding unchanged files.
3.  **Discord Embedded Diagnostics**: When users run `!health` or `!history`, the Discord bot generates rich embed cards summarizing CPU loads, uptime, database metrics, and API connectivity latency.

---

## 4. Dynamic Agent Creation

### Q: Can Gaki spin up new specialized worker agents at runtime?
**A:** "Yes. The system utilizes a helper module called the `define_subagent` tool. This enables the supervisor agent to dynamically spawn specialized micro-agents for specific sub-tasks."

- **Prompt Blueprinting**: The Orchestrator can create an agent blueprint defining a name (e.g., `DatabaseMigrationExpert`), a custom system prompt, and a restricted tool set.
- **Isolated Execution**: When invoked, the new subagent receives an isolated workspace branch, runs its instructions, reports the results back to the supervisor, and terminates. This keeps the primary Orchestrator's context window clean and free of redundant logs.

---

## 5. Mitigating AI Faults, Hallucinations, Loops, and Drift

### Q: How do you handle and prevent AI Hallucinations?
**A:** "LLMs love to invent library functions or write file contents that do not exist. We mitigate this using a **Strict Verification Loop**:"
*   **Tool Execution Checks**: When the LLM emits a tool call, the `executeToolCall` function validates the name against our registry in [tools/index.ts](file:///C:/Users/Dell/Desktop/mohit/mcp-sandbox/src/tools/index.ts). If the agent attempts to call a non-existent tool, the loop throws an exception and instructs the agent of the exact list of valid tools.
*   **Compiler Gates**: If the Implementer writes code utilizing fabricated parameters, the Verifier runs the TypeScript compiler (`tsc`). The build immediately fails with errors (e.g. `Property X does not exist on Y`), forcing the agent to rewrite its solution.

### Q: How do you mitigate Context/Content Drift?
**A:** "Context drift occurs when long agent runs fill up the LLM's history window, causing it to lose its system guidelines. We resolve this with three techniques:"
1.  **Sliding History Windows**: We maintain a sliding history buffer of the last 10 turns.
2.  **State-Tracking Artifacts**: We keep key developer information out of the conversation history by writing them directly to structured files:
    *   [task.md](file:///C:/Users/Dell/Desktop/mohit/mcp-sandbox/task.md) keeps track of completed/active/pending sub-tasks.
    *   [implementation_plan.md](file:///C:/Users/Dell/Desktop/mohit/mcp-sandbox/implementation_plan.md) stores design specifications.
3.  **System Prompt Re-injection**: The system prompt containing system boundaries and tool guidelines is prepended to the LLM message history on every single request.

### Q: How do you prevent infinite looping?
**A:** "Looping occurs when an agent repeatedly executes the same failing command (e.g., trying to write a file, getting a permission error, and retrying identical steps forever). We implement two loop-prevention gates:"
1.  **Max Step Counter**: Every agent run is bound to a maximum step limit (default: 10 steps). If the limit is reached, the loop terminates and escalates the issue.
2.  **Duplicate Command Detection**: We track the history of the last 3 tool calls. If the agent calls the same tool with the exact same parameters consecutively and receives the same error, Gaki detects the loop, halts execution, and reports: *"Infinite loop detected: Tool X called repeatedly with identical parameters. Aborting."*
