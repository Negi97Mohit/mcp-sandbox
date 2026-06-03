# 🤖 Gaki Autonomous Agentic Engineering Studio

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/Framework-Electron%20%7C%20React%20%7C%20TypeScript-orange.svg)](https://electronjs.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

Gaki is a production-grade, multi-agent AI engineering assistant designed to automate the full Software Development Lifecycle (SDLC). It features a robust **Supervisor-Worker Agent Topology**, an interactive **Electron Desktop Interface** equipped with a **Custom Tools Studio**, **Live Environment Configuration Hot-Reloading**, and **Eval-Driven Continuous Integration** testing.

---

## 📖 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Key Features](#-key-features)
   - [Supervisor-Worker Agent Topology](#supervisor-worker-agent-topology)
   - [Custom Tools Studio](#custom-tools-studio)
   - [Live Configuration Hot-Reloading](#live-configuration-hot-reloading)
   - [Human-in-the-Loop Gate](#human-in-the-loop-gate)
3. [Repository Structure](#-repository-structure)
4. [Installation & Setup](#-installation--setup)
   - [Prerequisites](#prerequisites)
   - [Quick Start](#quick-start)
   - [Running Gaki](#running-gaki)
5. [Evals & Regression Testing](#-evals--regression-testing)
6. [License](#-license)

---

## 📐 System Architecture

Gaki routes user queries through an advanced multi-agent pipeline governed by a central Orchestrator. This ensures separation of concerns, safety verification, and high autonomy.

```
                    ┌─────────────────────────────────┐
                    │         ORCHESTRATOR             │
                    │  • Receives user requests        │
                    │  • Decomposes into subtasks      │
                    │  • Routes tasks to specialists   │
                    │  • Classifies risk parameters    │
                    │  • Finalizes commit approvals   │
                    └──────┬─────────┬────────┬────────┘
                           │         │        │
                           ▼         ▼        ▼
               ┌────────────────┐  ┌──────────────┐  ┌────────────────┐
               │  PLANNER AGENT │  │  IMPLEMENTER │  │ VERIFIER AGENT │
               │   (Read-Only)  │  │    AGENT     │  │ (Execute-Only) │
               │                │  │              │  │                │
               │ • Analyzes code│  │ • Writes code│  │ • Runs compiler│
               │ • Scans git    │  │ • Runs shell │  │ • Type checks  │
               │ • Drafts step- │  │ • Stages     │  │ • Evaluates    │
               │   by-step plan │  │   changes    │  │   test coverage│
               └────────────────┘  │ • Reports    │  │ • Scores metric│
                                   │   diff files │  │   (0.0 - 1.0)  │
                                   └──────────────┘  └────────────────┘
                                           │
                    ┌─────────────────────▼──────────────────────┐
                    │               DECISION ENGINE              │
                    │  • Score ≥ 0.85 & Tests Pass  ➜ Auto PR    │
                    │  • Score ≥ 0.60               ➜ Review     │
                    │  • Score < 0.60               ➜ Escalate   │
                    └─────────────────────┬──────────────────────┘
                                           │
                    ┌─────────────────────▼──────────────────────┐
                    │            HUMAN-IN-THE-LOOP               │
                    │  • High/Critical action: pause execution   │
                    │  • Send Discord Embed approval controls   │
                    │  • Wait for Reaction (✅/❌) or Timeout    │
                    └────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### Supervisor-Worker Agent Topology
Instead of relying on a single agent loops which can go off-track, Gaki divides labor:
- **PlannerAgent**: Operates strictly in a read-only environment to inspect code layouts and design an `implementation_plan.md`.
- **ImplementerAgent**: Given an approved plan, it modifies code files and stages them using Git.
- **VerifierAgent**: Evaluates changes by compiling, running TypeScript checks, and running tests. It assigns a confidence score between `0.0` and `1.0`.

### Custom Tools Studio
The desktop GUI houses a custom suite to manage, extend, and understand tools:
* **AI Tool Explainer**: Activating the Sparkles AI icon slides out the assistant drawer, displaying a structured Markdown guide detailing arguments, return schemas, environment flags, and console usage examples.
* **AI Tool Modifier**: Built-in and custom tools can be modified using natural language instruction. Gaki runs the agent pipeline to execute the change, tests it, and shows a visual Git Diff side-by-side with **Approve & Merge** or **Discard Changes** buttons.
* **Source Viewer**: Direct, read-only syntax viewing of tool implementations without leaving the dashboard.
* **AI Tool Generator Form**: A step-by-step wizard prompting for the proposed tool name, input parameters (types, descriptions, required flags), API URL, and expected responses, which automatically outputs a valid, schema-compliant JavaScript handler.

### Live Configuration Hot-Reloading
To prevent the friction of restarting terminal sessions or desktop applications when API tokens or environment variables expire:
- An active `fs.watch` event listener tracks updates to the `.env` file.
- The configuration module triggers `reloadConfig()` to call `dotenv.config({ override: true })` and update the global configuration singleton.
- Running processes, Discord bots, and Electron modules immediately pick up new configurations (e.g. `OPENROUTER_API_KEY`) on the fly.

### Human-in-the-Loop Gate
All actions classified as High or Critical Risk (e.g. deleting files, committing, pushing, modifying key settings) invoke a gate:
- Execution is paused.
- The Discord bot sends a detailed embed report with reaction controls (`✅` to authorize, `❌` to abort).
- If no action is taken within 5 minutes, Gaki auto-rejects and rolls back staged files.

---

## 📂 Repository Structure

```
├── .env.example             # Template for required environment keys
├── package.json             # Core dependencies and command scripts
├── tsconfig.json            # Base TypeScript compiler settings
├── index.ts                 # Main startup file for Standalone CLI & Discord Bot
├── verify_sandbox.ts        # Executable tests sandbox checks
├── check_models.ts          # Validates API models and keys connectivity
├── src/                     # Core backend source files
│   ├── config/              # Global environment configuration (env.ts)
│   ├── agents/              # Orchestrator, Planner, Implementer, and Verifier implementations
│   ├── tools/               # Built-in and custom tool modules
│   └── bot/                 # Discord client setup and event handlers
├── electron/                # Electron main-process configuration & build settings
└── desktop-ui/              # React frontend application
    ├── src/
    │   ├── pages/           # Dashboard pages (CustomTools.tsx, Settings.tsx)
    │   ├── components/      # UI components (CopyButton, DiffView)
    │   └── api/             # Electron IPC Bridge bindings (bridge.ts)
    └── package.json         # React project dependencies
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** v20.0.0 or higher
- **Git** installed and configured
- **OpenRouter API Key** (or standard OpenAI/Anthropic/Gemini keys)
- **Discord Bot Token** (Required for standalone/Discord CLI mode)

### Quick Start

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Negi97Mohit/mcp-sandbox.git
   cd mcp-sandbox
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   cd desktop-ui && npm install && cd ..
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and configure your keys:
   - `OPENROUTER_API_KEY`: Your OpenRouter api key.
   - `DISCORD_TOKEN`: Your Discord application token.
   - `GITHUB_TOKEN`: (Optional) GitHub API authentication.

### Running Gaki

#### Option A: Gaki Desktop Application (Recommended)
This runs the Electron desktop window and launches the React-Vite visual UI.
```bash
npm run dev:desktop
```

#### Option B: Standalone CLI & Discord Bot
This launches Gaki as a terminal CLI application and starts listening to Discord events.
```bash
npm run dev
```

---

## 🧪 Evals & Regression Testing

Gaki relies on a continuous integration eval suite comprising 20 critical execution test cases (e.g. system commands, path traversal defenses, Git integration).

Run the full suite:
```bash
npm run eval
```

To run a specific test category (e.g. shell permissions):
```bash
npm run eval -- --category shell
```

> [!IMPORTANT]
> The CI suite expects an accuracy score of **80% or greater** for builds to pass. Any security traversal attempts will instantly fail the evaluation.

---

## 📄 License
Licensed under the [ISC License](LICENSE).
