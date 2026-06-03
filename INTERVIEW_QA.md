# 🎓 Gaki Engineering Interview Preparation Guide

This guide is structured as a technical Q&A to help you prepare for interviews, code reviews, and presentations of Gaki's architecture and features.

---

## 📖 Table of Contents
1. [High-Level Architecture & Agent Topology](#1-high-level-architecture--agent-topology)
2. [Security, Safety, & Risk Management](#2-security-safety--risk-management)
3. [Custom Tools Studio Implementation](#3-custom-tools-studio-implementation)
4. [Live Configuration Hot-Reloading](#4-live-configuration-hot-reloading)
5. [IPC Communication & Error Management](#5-ipc-communication--error-management)
6. [Verification, Evals, & Quality Assurance](#6-verification-evals--quality-assurance)

---

## 1. High-Level Architecture & Agent Topology

### Q: What is Gaki and what is its core value proposition?
**A:** Gaki is an autonomous software engineering assistant that manages the Software Development Lifecycle (SDLC). It bridges the gap between AI code generation and visual control centers by offering:
- A visual **Electron Desktop App** for managing workspaces, credentials, and custom tools.
- A **Supervisor-Worker Multi-Agent topology** that ensures structured execution, compiler safety, and validation.
- **Custom Tools Studio** to dynamically explore, explain, modify, or auto-generate custom API tools.
- **Zero-Restart Live Reloading** for dynamic environment updates (e.g. updating API keys).

### Q: Why did you choose a Supervisor-Worker (Orchestrator-Worker) pattern over a single monolithic agent?
**A:** Monolithic ReAct (Reasoning and Action) loops are prone to context drift, task loop stagnation, and high security risks. By separating concerns, we achieve:
1. **Focus**: Each worker agent is customized with a specialized system prompt, system tools, and constraints.
2. **Safety**: Planner agents can read files but cannot modify them; Verifier agents can run tests but cannot rewrite them.
3. **Traceability**: The Supervisor (Orchestrator) manages high-level sub-tasks, making it easier to log execution state and pause for user approvals.

### Q: Walk me through the duties of each agent in Gaki's pipeline.
**A:** 
- **Orchestrator**: The entry point. It parses user intent, classifies the action risk, decomposes tasks, triggers the workflow, and performs the final merge or commit check.
- **PlannerAgent (Read-Only)**: Inspects the codebase structure, reads target files, and drafts a markdown `implementation_plan.md` outlining the required changes and verification steps.
- **ImplementerAgent (Write/Shell)**: Reads the plan and writes code changes to disk. It stages files inside Git.
- **VerifierAgent (Execute-Only)**: Evaluates the staged code. It runs type checks, compiles target code, executes unit tests, and scores the quality from `0.0` (failed/broken) to `1.0` (perfectly working, types align, tests pass).

---

## 2. Security, Safety, & Risk Management

### Q: How do you enforce security and prevent destructive shell commands (like `rm -rf /`)?
**A:** Gaki uses a multi-layered security defense:
1. **System Prompt Rules**: Strict guidelines forbid destructive commands, out-of-bounds paths, or system modification scripts.
2. **Risk Classifier**: The Orchestrator inspects tools and shell parameters. Low-risk operations (e.g. `list_dir`, `view_file`) execute automatically. High-risk operations (e.g. editing host files, writing custom scripts, running arbitrary commands) trigger a **Human-in-the-Loop (HITL) Gate**.
3. **Sandboxed Workspaces**: Custom tool scripts run inside an isolated Node.js VM context (`vm2` or standard sandbox boundaries), preventing them from writing directly to the host operating system's system folders.

### Q: How does the Human-in-the-Loop (HITL) Gate work in practice?
**A:**
- **Discord Integration**: Gaki pauses execution and broadcasts an interactive embed message on Discord with Reaction Buttons (`✅` to approve, `❌` to reject). It includes a 5-minute timeout. If the user doesn't respond, it auto-rejects and reverts files.
- **Electron UI Drawer**: When modifying tools via AI, Gaki generates a visual **Git Diff** preview panel. The agent cannot merge the code directly; the user must inspect the diff and click **Approve & Merge** or **Discard Changes** (which runs `git checkout` to clean the working state).

---

## 3. Custom Tools Studio Implementation

### Q: How does the "Explain Tool" feature work under the hood?
**A:** 
1. When a user clicks the Sparkles icon on a tool card, React triggers an IPC invoke call to the backend (`custom-tools:ai-explain`) passing the tool's unique identifier.
2. The backend resolves the tool's source code path and hands it to a specialized **ExplainerAgent**.
3. The Explainer parses the TypeScript/JavaScript schema and prints a Markdown manual explaining:
   - What the tool does.
   - All input arguments, types, and whether they are optional or required.
   - Any credentials it depends on (e.g. `GITHUB_TOKEN`).
   - Command-line/bot execution examples.
4. The Markdown is returned to React, which renders it in a slide-out assistant drawer using a dynamic, dependency-free React markdown renderer (`MarkdownViewer`).

### Q: Describe the workflow when a user modifies a tool using the "AI Modifier" drawer.
**A:**
1. The user inputs their desired change (e.g., *"Update the git-commit tool to auto-summarize messages using GPT-4o"*).
2. The UI issues an IPC invocation to `custom-tools:ai-modify-builtin` (or `custom-tools:ai-modify-custom`).
3. The backend starts a worker process and streams logs in real-time via the `custom-tools:ai-modify-log` IPC channel, which are rendered on the frontend.
4. The worker applies changes to the tool code, compiles it, and validates it.
5. Once completed, Gaki generates a **Git Diff** comparing the modified code to the clean git index.
6. The frontend shows the side-by-side Diff. The user can review and approve it.

### Q: How does the "AI Tool Generator Form" translate user descriptions into working code?
**A:**
- The user fills out a structured modal: tool name, parameters (names, types, required flags), target API endpoint (if any), and expected returns.
- The UI packages this into a structured JSON payload and passes it to the AI generator.
- The LLM receives a strict system prompt instructing it to output a JSON object containing:
  1. A valid JSON schema matching Gaki's tool configuration format.
  2. A self-contained, sandboxed JavaScript handler function executing the requested API calls (using fetch/axios equivalents).
- The returned code is injected straight into Gaki's tool registry and pre-loaded into the code editor, allowing immediate testing.

---

## 4. Live Configuration Hot-Reloading

### Q: What problem does Live Configuration Hot-Reloading solve, and why is it important?
**A:** In typical Node.js/Electron setups, calling `dotenv.config()` loads `.env` variables into `process.env` once at boot time. If a user modifies settings (such as replacing an expired `OPENROUTER_API_KEY`), the active processes (the Electron backend, the React renderers, and background CLI/Discord processes) still reference the old key cached in `process.env`. The user gets trapped in `429 Rate Limit` loops unless they manually restart the app, which ruins the user experience.

### Q: How did you implement hot-reloading?
**A:**
1. **File Watcher (`fs.watch`)**: Added an active file watcher on the `.env` file in the root workspace directory.
2. **Reload Handler**: When a modification event occurs, Gaki triggers a debounce timer (to avoid double-reads during fast writes) and calls `reloadConfig()`.
3. **Dotenv Override**: The reloader runs `dotenv.config({ override: true })` to force-override the existing keys inside `process.env`.
4. **Dynamic Clients**: All LLM client instances (e.g., OpenRouter, OpenAI, Anthropic clients) fetch keys dynamically via a global config getter object (`CONFIG.openrouterKey`) rather than caching them in module-level scope variables. When the config updates, subsequent API calls automatically use the new tokens.

---

## 5. IPC Communication & Error Management

### Q: Explain Gaki's React-to-Electron IPC Bridge structure.
**A:**
- **Electron Main Process (`electron/main.ts`)**: Sets up IPC listeners (`ipcMain.handle` and `ipcMain.on`) for events like listing tools, updating settings, explaining files, and reloading environments.
- **Preload Script (`electron/preload.ts`)**: Exposes a secure, context-isolated bridge via `contextBridge.exposeInMainWorld('api', { ... })`. This keeps the React renderer sandboxed while allowing it to fire specific IPC messages.
- **React Frontend (`desktop-ui/src/api/bridge.ts`)**: Contains TypeScript definitions matching the preload bridge, allowing standard, typed calls like `window.api.customTools.explainTool(toolId)`.

### Q: How are exceptions managed across the visual components?
**A:** 
- All IPC invokes on the React frontend are wrapped inside `try/catch` blocks.
- Caught errors are sent to `console.error` to appear in Electron's DevTools inspector.
- The UI handles errors gracefully by showing alert banners (e.g., inside the AI Assistant drawer or Questionnaire modal).
- A `CopyButton` component is integrated next to all UI error displays, allowing developers to copy stack traces to their clipboard for quick debugging.

---

## 6. Verification, Evals, & Quality Assurance

### Q: What is Gaki's Eval-CI suite, and how is it used to prevent regressions?
**A:** The regression suite consists of 20 automated test cases evaluating essential tool features, shell execution logic, context handling, and sandboxing rules.
- It operates in a headless CLI mode.
- Each test runs the agent against a mock problem (e.g., *"Read index.ts, compute a file checksum, and return it"*).
- The Verifier scoring module validates the results.
- **CI Gate**: If the overall accuracy rate is under **80%**, the GitHub Actions workflow fails, preventing pull request merges.

### Q: How is compiler-safety enforced during tool modifications?
**A:** When Gaki modifies a tool's source code, it invokes the local TypeScript compiler (`npx tsc`) on the file prior to execution. If compiler diagnostics report any typing errors (e.g. `TS2322`, `TS2339`), the modification fails, the error details are outputted, and the agent rolls back the files to prevent pushing broken files to production.
