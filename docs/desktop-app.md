# 🖥️ Desktop Application Guide

The Gaki Desktop App is an Electron-based application with a React + Vite frontend. It gives you a visual interface to interact with the AI system without Discord.

---

## Starting the Desktop App

```bash
# Make sure frontend dependencies are installed (first time only)
cd desktop-ui && npm install && cd ..

# Launch the desktop app
npm run dev:desktop
```

This starts:
1. The **Electron main process** — loads the app window
2. The **Vite dev server** — serves the React frontend with hot-reload
3. The **backend agent system** — same agents as the CLI mode, but connected via IPC

---

## The IPC Bridge

**File**: [`desktop-ui/src/api/bridge.ts`](../desktop-ui/src/api/bridge.ts)

The React frontend cannot directly call Node.js APIs (for security). Instead, it communicates with the Electron main process via **IPC (Inter-Process Communication)**:

```
React UI  →  window.electronAPI.runAgent(task)  →  Electron IPC  →  orchestrator.run()
          ←  events streamed back via ipcRenderer.on("agent-log", ...)
```

This keeps the UI and the backend fully separated. The same backend that handles Discord messages also handles desktop UI requests.

---

## Pages & Panels

### Dashboard
The main page showing:
- **Active Task Status**: Current agent phase (Planning / Implementing / Verifying) with a progress indicator
- **Live Log Stream**: Real-time output from agents — same logs sent to Discord, shown here in the UI
- **Graph View**: Visual DAG of task nodes (Planning → Implementation → Verification → Decision) with color-coded status badges
  - 🟦 Indigo = Planning
  - 🟡 Amber = Implementation
  - 🟢 Emerald = Verification / Success
  - 🔴 Rose = Failure / Escalation

### Custom Tools Studio
Four sub-panels for managing tools:

#### 1. Tool List
Browse all registered tools (built-in + custom). Each tool shows:
- Name and description
- ✨ Sparkles button → opens AI Explainer drawer
- ✏️ Edit button → opens AI Modifier drawer
- 👁️ Source button → opens read-only code viewer
- 🗑️ Delete button (custom tools only)

#### 2. AI Explainer Drawer
Click the sparkles icon on any tool → the `ExplainerAgent` runs and generates a structured Markdown guide. Shows:
- What the tool does in plain English
- All parameters with types and examples
- Return schema
- Example usage in Discord and direct API call format

#### 3. AI Modifier Drawer
Click the edit icon on any tool → opens a text area:
```
Describe the change you want:
> Add a timeout parameter that defaults to 30 seconds
```

The `GeneratorAgent` runs the full agent pipeline:
1. Reads the current tool code
2. Plans the change
3. Implements and tests it
4. Shows a **side-by-side Git diff**:
   ```
   - async function handleNetlifyDeploy(args) {
   + async function handleNetlifyDeploy(args, timeout = 30000) {
   ```
5. **Approve & Merge** button → applies the change
6. **Discard Changes** button → rolls back

#### 4. AI Tool Generator Form
Step-by-step wizard to create a new tool from scratch:

```
Step 1: Tool Name
        [fetch_crypto_price                    ]

Step 2: Description
        [Fetch the current USD price of a coin ]

Step 3: Parameters
        [+ Add Parameter]
        name: symbol   type: string   required: ✅
        description: Cryptocurrency symbol (BTC, ETH, SOL)

Step 4: API Endpoint
        [https://api.coingecko.com/api/v3/...  ]

Step 5: Expected Response
        [{ "bitcoin": { "usd": 45000 } }       ]

[Generate Tool]
```

After clicking Generate, the AI writes the JavaScript handler and shows a preview. Click **Register** to save it.

### Settings Page
- **Environment Variables**: View and edit all `.env` values directly in the UI
  - Changes are written to `.env` and hot-reloaded immediately
  - Sensitive keys (API tokens) are masked by default with a toggle to reveal
- **Model Selector**: Dropdown to change the LLM model
- **Agent Thresholds**: Sliders for `AUTO_COMMIT_THRESHOLD` and `APPROVAL_THRESHOLD`
- **Workspace Manager**: View all user workspaces, see their sizes, delete orphaned ones

---

## Charts & Observability

The dashboard includes two charts powered by **Recharts**, reading from `src/health/statsTracker.ts`:

### Pie Chart — Tool Usage Distribution
Shows which tools are called most frequently. Updated after every agent run.

```
        run_shell  ████████████████ 45%
        read_file  ████████ 22%
       write_file  ██████ 18%
       list_files  ████ 10%
           other  ██ 5%
```

Useful for seeing if your agents are spending too much time on shell commands vs. actual file changes.

### Line Chart — Agent Performance (7-Day Window)
Tracks over time:
- **Response latency** (ms per agent run)
- **Token usage** (estimated per run)
- **Error rate** (failed runs / total runs)
- **Confidence scores** (rolling average)

---

## Desktop-Specific Features

### No Sandbox Restrictions
The desktop app always runs as `desktop-admin`. This means:
- No workspace isolation — agents can access any path on disk
- No permission checks — all tools are available
- The active workspace path is shown in the top bar and can be changed

### Workspace Switcher
A dropdown in the top navigation bar lets you switch the **active workspace**:
```
Active Workspace: [📁 mcp-sandbox ▼]
  mcp-sandbox       (current)
  my-other-project
  + Browse...
```

The agent always operates in the selected workspace path.

### Git Diff Viewer
The side-by-side diff viewer is used in three places:
1. When the AI Modifier proposes a tool change
2. When the Orchestrator decision is `request_approval`
3. When you click "View Changes" after an agent run

Color coding:
- 🟢 Green background = added lines
- 🔴 Red background = deleted lines  
- ⬜ Grey = unchanged context lines

### Approval Gate in Desktop
Instead of Discord reactions, the desktop app shows a **modal dialog**:

```
┌─────────────────────────────────────────────┐
│  ⚠️  Action Approval Required               │
│                                             │
│  Action:     Create PR "fix: auth bug"      │
│  Risk Level: 🔴 HIGH                        │
│  Confidence: 88% | Tests: 12/12 passing     │
│                                             │
│  [View Full Diff]                           │
│                                             │
│     [✅ Approve]      [❌ Reject]           │
└─────────────────────────────────────────────┘
```

---

## Electron Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Electron Main Process               │
│                  (electron/main.ts)                  │
│                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │  BrowserWindow      │  │  IPC Handlers       │   │
│  │  (loads React app)  │  │  runAgent()         │   │
│  │                     │  │  getTools()         │   │
│  └─────────────────────┘  │  updateEnv()        │   │
│                           │  getStats()         │   │
│                           └─────────────────────┘   │
│                                    │                 │
│                         imports backend modules      │
│                         (orchestrator, tools, etc.)  │
└──────────────────────────────────────────────────────┘
           ↕ IPC (ipcMain / ipcRenderer)
┌──────────────────────────────────────────────────────┐
│              React Frontend (Vite)                   │
│              (desktop-ui/src/)                       │
│                                                      │
│  pages/Dashboard.tsx   pages/CustomTools.tsx         │
│  pages/Settings.tsx                                  │
│                                                      │
│  api/bridge.ts → window.electronAPI.*                │
└──────────────────────────────────────────────────────┘
```

The `preload.js` script exposes a safe `window.electronAPI` object to the renderer process, enabling the React app to call backend functions without having access to raw Node.js APIs.
