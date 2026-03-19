# 🤖 MCP-Sandbox — AI-Powered Discord DevOps Agent

**A production-grade, multi-tool AI agent that turns Discord into a DevOps command center — with LLM-driven reasoning, sandboxed execution, Netlify CI/CD monitoring, and real-time observability.**

---

## Overview

Modern DevOps teams manage infrastructure, deployments, and codebases across an ever-growing number of dashboards, CLIs, and cloud consoles. **MCP-Sandbox** collapses that surface area into a single Discord interface by exposing a reasoning-capable AI agent that can execute shell commands, manage files, deploy to Netlify, and monitor production deployments — all while enforcing role-based access control and per-user sandboxing.

**Why it matters:** This isn't a chatbot wrapper around an API. It's an autonomous agent with tool-calling capabilities, persistent session state, real-time streaming output, and AIOps features like AI-driven Root Cause Analysis on deployment failures. It demonstrates production engineering patterns — RBAC, workspace isolation, observability pipelines, daemon-based polling, and graceful fallback parsing for LLM outputs — that separate prototype-quality AI integrations from systems ready for production traffic.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Discord Gateway                          │
│                    (discord.js WebSocket)                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │  Message Events
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Discord Client Layer                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ Admin Cmds   │  │ Permission Gate  │  │ Chat History Mgr  │  │
│  │ (!grant,     │  │ (RBAC Check)     │  │ (per-user/channel │  │
│  │  !health,    │  │                  │  │  conversation)    │  │
│  │  !stats)     │  │                  │  │                   │  │
│  └──────────────┘  └──────────────────┘  └───────────────────┘  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      LLM Reasoning Engine                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              OpenRouter API (Multi-Model)                │    │
│  │   • Native tool_calls extraction                        │    │
│  │   • JSON fallback parser                                │    │
│  │   • Regex-based text tool-call parser                   │    │
│  │   • Reasoning chain preservation (CoT)                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────┬─────────────────────────────────────────┘
                         │  Tool Calls
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Tool Execution Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  Shell   │ │  Files   │ │  Search  │ │  Netlify Tools     │  │
│  │ run_shell│ │write_file│ │find_git_ │ │ env_manage         │  │
│  │ (stream) │ │read_file │ │repos     │ │ functions_manage   │  │
│  │          │ │list_files│ │          │ │ site_manage/deploy │  │
│  │          │ │          │ │          │ │ monitor_add/remove │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
│                     ▲                                            │
│        ┌────────────┴────────────┐                               │
│        │  Workspace Sandboxing   │                               │
│        │  (Path Traversal Guard) │                               │
│        └─────────────────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌────────────────┐ ┌────────────┐ ┌────────────────────────────┐
│  Health Check  │ │   Stats    │ │  Netlify Monitor Daemon    │
│  Engine        │ │  Tracker   │ │  (30s polling loop)        │
│  • API probe   │ │  • msgs    │ │  • Deploy state detection  │
│  • Token check │ │  • tools   │ │  • Discord embed reports   │
│  • System info │ │  • errors  │ │  • AI Root Cause Analysis  │
│  • Tool audit  │ │  • latency │ │    on build failures       │
│  • JSON report │ │  • charts  │ │                            │
│    persistence │ │  (QChart)  │ │                            │
└────────────────┘ └────────────┘ └────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (ES2022, ESM modules) |
| **Language** | TypeScript 5.9 (strict mode, `NodeNext` module resolution) |
| **Chat Platform** | Discord.js 14 (Gateway Intents, Partials, Embeds) |
| **LLM Gateway** | OpenRouter API (OpenAI-compatible, multi-model routing) |
| **Default Model** | `nvidia/nemotron-3-nano-30b-a3b:free` (configurable) |
| **Cloud Services** | Firebase Admin SDK (Firestore-ready), Netlify REST API |
| **Git Integration** | `simple-git` (programmatic Git remote extraction) |
| **HTTP Client** | Axios + native `fetch` |
| **Secrets Management** | `dotenv` (.env file, gitignored) |
| **Visualization** | QuickChart.io (server-side chart rendering, no browser required) |
| **Process Management** | Node.js `child_process.spawn` (streaming, cross-platform) |
| **Build Tool** | TypeScript compiler (`tsc`), `tsx` for dev mode |

---

## Key Features

- **Autonomous Multi-Tool Agent** — The LLM decides which tools to invoke, chains them, and synthesizes results into natural-language responses. Supports iterative tool-call resolution (call → observe → reason → call again).

- **Role-Based Access Control (RBAC)** — Four-tier permission system (`none`, `read`, `write`, `admin`) with a JSON-backed permission store. Admin users are auto-promoted via an environment variable. Permissions are granted/revoked via Discord commands (`!grant`, `!revoke`, `!permissions`).

- **Per-User Workspace Sandboxing** — Non-admin users are confined to isolated workspace directories. All file operations and shell `cd` commands are validated against the workspace boundary via path-traversal guards, preventing directory escape attacks.

- **Streaming Shell Execution** — Shell commands run via `spawn` (not `exec`), providing real-time streamed output back to Discord with a 1.5-second throttled buffer. ANSI escape codes are stripped for clean display. Cross-platform shell detection (`cmd.exe` on Windows, `/bin/sh` on Unix).

- **Persistent Shell Sessions** — Each Discord channel maintains its own working directory state, enabling multi-step workflows (e.g., `cd project → git pull → npm install → npm run build`) without losing directory context between messages.

- **Netlify CI/CD Monitoring Daemon** — A background polling loop (30s interval) watches registered Netlify sites for completed deployments. Successful and failed deploys are reported to Discord as rich embeds with commit info, branch, and duration.

- **AI-Powered Root Cause Analysis (RCA)** — When a Netlify deployment fails, the daemon fetches build logs via the Netlify API, feeds the last 3000 characters to the LLM, and posts a structured Root Cause + Proposed Fix analysis to the Discord channel.

- **Comprehensive Health Check System** — On-demand (`!health`) and startup health reports that probe API key validity, Discord token configuration, LLM model connectivity (with latency measurement), tool registration integrity, and system resource usage (OS, Node version, memory, uptime).

- **Usage Analytics with Chart Visualization** — Tracks daily metrics (messages processed, tool calls by type, errors, response times) and generates QuickChart.io visualizations: usage trend lines, response time charts, tool distribution pie charts, and health status timelines — all rendered as Discord embeds.

- **Resilient LLM Output Parsing** — Triple-fallback strategy for extracting tool calls: native OpenAI-format `tool_calls` → JSON array detection → regex-based text parser with balanced-parenthesis handling. Handles models that emit tool calls as plaintext instead of structured JSON.

- **Smart Message Splitting** — Code-block-aware Discord message chunking that preserves syntax highlighting across splits, handles hard wraps for extra-long lines, and respects Discord's 2000-character limit.

---

## AI/ML Components

### LLM Integration
- **Provider:** OpenRouter (unified gateway to 100+ models)
- **Default Model:** NVIDIA Nemotron 3 (30B, free tier) — swappable via `MODEL_NAME` env var
- **Reasoning Support:** Chain-of-thought `reasoning_details` are preserved in conversation history across turns, enabling the model to build on its own reasoning chain
- **Tool Calling:** OpenAI-compatible function calling with automatic `tool_choice: "auto"`

### Agent Architecture
This is a **ReAct-style (Reason + Act) agent** with a single reasoning loop:
1. User message → LLM with system prompt + tool definitions
2. LLM returns tool calls → Agent executes tools
3. Tool results appended to conversation → LLM produces final answer

The system prompt is dynamically generated per user, injecting OS info, workspace path, and permission level to give the LLM grounded context about its execution environment.

### Multi-Model Fallback Parsing
Models accessed via OpenRouter don't always emit structured `tool_calls`. The system handles three output formats:
- **Native tool_calls** — Standard OpenAI-format JSON
- **Inline JSON arrays** — Detected via bracket heuristics, validated for correct schema
- **Text-based tool calls** — Regex parser handles `tool_name(key="value")` syntax with balanced parentheses, nested quotes, and escape sequences

### AI Root Cause Analysis
Failed Netlify deployments trigger an automated LLM analysis pipeline:
1. Build logs fetched from Netlify API (`/deploys/{id}/logs`)
2. Last 3000 characters extracted as context window
3. Structured prompt requests **Root Cause** and **Proposed Fix**
4. LLM response streamed back to Discord with smart chunking

### Model Verification Utility
A standalone `check_models.ts` script probes Google Generative AI (Gemini) model availability to validate API key access and model quota status — useful for debugging model access issues during development.

---

## Data Pipeline

```
Discord Message
      │
      ▼
┌─────────────────┐     ┌──────────────────┐
│ Permission Gate │────▶│ Conversation Mgr │
│ (RBAC lookup)   │     │ (per-user/channel│
└─────────────────┘     │  history array)  │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ OpenRouter LLM   │
                        │ (tool selection) │
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Shell   │ │  Files   │ │ Netlify  │
              │ Executor │ │ Manager  │ │ Tools    │
              └────┬─────┘ └────┬─────┘ └────┬─────┘
                   │            │            │
                   ▼            ▼            ▼
              Tool Results (JSON) appended to history
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ OpenRouter LLM   │
                        │ (final answer)   │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Smart Splitter   │──▶ Discord Reply
                        │ (code-block      │
                        │  aware chunking) │
                        └──────────────────┘

   ── Parallel Background Pipeline ──

┌──────────────────┐     ┌──────────────────┐
│ Stats Tracker    │     │ Netlify Daemon   │
│ (daily JSON      │     │ (30s poll loop)  │
│  file-backed     │     │                  │
│  metrics)        │     │ Deploy → Embed   │
│                  │     │ Failure → RCA    │
└──────────────────┘     └──────────────────┘
```

---

## API Design

### LLM Tool Interface (OpenRouter)

All LLM interactions go through a single function:

```typescript
callOpenRouter(messages: any[]): Promise<AIMessage>
```

**Request shape** (to OpenRouter):
```json
{
  "model": "nvidia/nemotron-3-nano-30b-a3b:free",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "tools": [ /* OpenAI-format function definitions */ ],
  "tool_choice": "auto"
}
```

### Registered Tool Definitions

| Tool | Description | Parameters |
|---|---|---|
| `run_shell` | Execute shell commands with streaming output | `command: string` |
| `write_file` | Write content to a file (sandbox-aware) | `path: string, content: string` |
| `read_file` | Read file content (sandbox-aware) | `path: string` |
| `list_files` | List directory contents | `path?: string` |
| `find_git_repos` | Recursive git repo scanner | `start_path?: string, max_depth?: number` |
| `netlify_env_manage` | Manage Netlify env vars | `action: set\|get\|list\|unset\|import` |
| `netlify_functions_manage` | Manage serverless functions | `action: list\|serve\|invoke\|create` |
| `netlify_site_manage` | Manage Netlify sites | `action: list\|info\|init\|link\|unlink\|status` |
| `netlify_deploy` | Deploy to Netlify | `prod?: bool, build?: bool, message?: string` |
| `netlify_build_run` | Run Netlify build locally | `dry?: bool, context?: string` |
| `netlify_dev_exec` | Execute in Netlify Dev env | `command: string` |
| `netlify_run` | Generic Netlify CLI command | `args: string` |
| `netlify_monitor_add` | Add site to deployment monitor | `target: string` |
| `netlify_monitor_list` | List monitored sites | — |
| `netlify_monitor_remove` | Remove site from monitor | `siteIdOrName: string` |

### Discord Admin Commands

| Command | Description |
|---|---|
| `!grant @user <read\|write\|admin>` | Grant permission level |
| `!revoke @user` | Revoke all permissions |
| `!permissions` | List all user permissions |
| `!workspace create @user` | Create a user workspace |
| `!health` | Run and display health checks |
| `!history [days]` | Show health report history |
| `!stats [days]` | Show usage analytics with charts |

---

## Observability

### Health Checks (`!health`)
Automated probes run on startup and on command:
- **API Key Validation** — Presence + format check (`sk-or-` prefix)
- **Discord Token Check** — Configuration verification
- **Model Connectivity** — Live ping to OpenRouter with latency measurement
- **Tool Registration Audit** — Verifies all tool modules loaded correctly
- **System Info** — OS, Node.js version, process uptime, heap memory usage

Results are persisted as dated JSON files (`health_reports/health_YYYY-MM-DD.json`) for historical trend analysis.

### Usage Statistics (`!stats`)
Daily metrics tracked and persisted to `stats/stats_YYYY-MM-DD.json`:
- Messages processed
- Tool calls (broken down by tool name)
- Error count
- Response times (avg, min, max per day)

### Chart Visualization
QuickChart.io renders server-side charts embedded directly into Discord:
- **Usage Trend** — Line chart of messages and tool calls over time
- **Response Time** — Average and max latency trend with dashed outlier line
- **Tool Distribution** — Pie chart of tool invocation frequency
- **Health Timeline** — Bar chart mapping health status (healthy/degraded/critical) over time
- **Error Rate** — Color-coded daily error bar chart (green = 0, red = >0)

### Logging
- Structured console logs with emoji prefixes for quick visual scanning
- Tool execution logging (`⚙️ Executing: ...`)
- API response debugging (`📡 API Response: ...`)
- Error tracking (`❌ Error: ...`)

---

## Security

### Access Control
- **Tiered RBAC** — `none → read → write → admin` with JSON-backed persistence (`permissions.json`)
- **Super Admin** — `ALLOWED_USER_ID` env var auto-promotes to admin, bypassing the permission store
- **Silent Rejection** — Unauthorized users receive no response (prevents information leakage)

### Workspace Isolation
- Non-admin users are sandboxed to `workspaces/{userId}/`
- All file paths are resolved via `path.resolve()` and checked against the workspace root
- Path traversal attempts (`../escape.txt`) are caught and rejected with explicit error messages
- Shell `cd` commands validate the target directory against workspace boundaries

### Secrets Management
- All secrets stored in `.env` (gitignored)
- API keys masked in health reports (first 12 + last 4 characters only)
- Firebase service account loaded from a separate JSON file (not hardcoded)
- Startup warnings if critical secrets are missing

### Input Validation
- Tool argument parsing wrapped in try/catch with fallback to empty objects
- Shell output ANSI codes stripped before forwarding to Discord
- Code-block-aware message splitting prevents Markdown injection
- User IDs sanitized with regex before use in filesystem paths: `userId.replace(/[^a-zA-Z0-9_-]/g, '')`

---

## Setup & Installation

### Prerequisites
- Node.js 18+ (ES2022 support required)
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- An OpenRouter API key ([openrouter.ai](https://openrouter.ai/))
- (Optional) Netlify Personal Access Token for deployment monitoring
- (Optional) Firebase service account JSON for Firestore integration

### Installation

```bash
# Clone the repository
git clone https://github.com/Negi97Mohit/mcp-sandbox.git
cd mcp-sandbox

# Install dependencies
npm install

# Create environment file
cp .env.example .env  # Then edit with your keys
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
DISCORD_TOKEN=your_discord_bot_token
OPENROUTER_API_KEY=sk-or-your_openrouter_key

# Optional
ALLOWED_USER_ID=your_discord_user_id        # Super admin
MODEL_NAME=nvidia/nemotron-3-nano-30b-a3b:free  # Default model
NETLIFY_TOKEN=your_netlify_personal_access_token
SERVICE_KEY_PATH=service-account.json       # Firebase service account
GOOGLE_API_KEY=your_google_api_key          # For check_models.ts utility
```

### Running

```bash
# Development (with hot reload via tsx)
npm run dev

# Production
npm run build    # Compile TypeScript
npm run start    # Run compiled JS
```

---

## Usage Examples

### Basic DevOps via Discord

```
User:  List all git repos on my machine
Bot:   ⚙️ *Thinking... then running find_git_repos*
       ✅ Found 12 repos:
       1. C:\Users\Dell\Desktop\mohit\mcp-sandbox
       2. C:\Users\Dell\Desktop\mohit\livestream-app
       ...
```

```
User:  What's the status of the livestream-app repo?
Bot:   ⚙️ *Thinking... then running run_shell*
       $> git -C C:\Users\Dell\Desktop\mohit\livestream-app status
       On branch main, 3 files modified...
```

### Netlify Deployment Monitoring

```
User:  Monitor my app at C:\Users\Dell\Desktop\mohit\livestream-app
Bot:   🔍 *Analyzing target...*
       🔍 *Searching Netlify for a site linked to repository:
           https://github.com/user/livestream-app*
       ✅ Successfully added Netlify site **livestream-app** to the
          deployment monitor for this channel!
```

When a deploy fails, the bot automatically posts:
```
❌ Deployment Failed: livestream-app
   Commit: a1b2c3d | Branch: main | Duration: 45s
   Message: fix: update API endpoint

🔍 *Fetching build logs and running AI Root Cause Analysis...*

🤖 AI Root Cause Analysis
   Root Cause: Module '@/lib/api' not found — the import path
   references a deleted file...
   Proposed Fix: Update the import in src/app/page.tsx to...
```

### Admin Permission Management

```
Admin: !grant @teamlead write
Bot:   ✅ Granted **write** access to TeamLead#1234

Admin: !health
Bot:   🟢 Bot Health Report
       ✅ API Key configured
       ✅ Discord Token configured
       ✅ Model responding (342ms)
       ✅ 15 tools registered
       📊 System Status: win32 10.0.22631 | Node v20.11.0 | Uptime: 2h 15m
```

---

## Challenges & Design Decisions

### 1. LLM Output Format Unpredictability
**Challenge:** Models accessed via OpenRouter (especially free-tier models) don't consistently emit structured `tool_calls`. Some return tool invocations as plaintext, JSON arrays, or Python-style function calls.

**Decision:** Implemented a triple-fallback parser — native `tool_calls` → JSON array detection → regex-based text parser with balanced parenthesis tracking and escape-aware string handling. This makes the system resilient to model behavior variance without requiring model-specific code.

### 2. Multi-User Safety on a Shared Host
**Challenge:** The agent executes arbitrary shell commands and file operations on the host machine. In a multi-user Discord server, this is a critical security surface.

**Decision:** Built a full RBAC + workspace isolation system. Non-admin users are sandboxed to per-user directories with all path operations validated against the workspace boundary. Path traversal attacks are caught and rejected. Admin users get unrestricted access by design (they own the machine).

### 3. Real-Time Output Streaming vs. Discord Rate Limits
**Challenge:** Long-running commands (e.g., `npm install`) produce streaming output, but Discord has aggressive rate limits on message sends.

**Decision:** Shell execution uses `spawn` (not `exec`) for streaming, with a 1.5-second throttled buffer that batches output before forwarding to Discord. ANSI codes are stripped server-side. This balances real-time feedback with rate limit compliance.

### 4. Deployment Monitoring Without Webhooks
**Challenge:** Detecting Netlify deployment status changes requires either webhooks (which need a public endpoint) or polling.

**Decision:** Implemented a lightweight daemon with a 30-second polling interval. The `lastSeenDeployId` pattern ensures each deploy is processed exactly once. This avoids the need for a public-facing server while still providing near-real-time notifications.

### 5. Conversation State Management
**Challenge:** LLM conversations need per-user isolation (so one user's context doesn't bleed into another's), but also per-channel isolation (so different channels can have independent workflows).

**Decision:** Used composite keys (`channelId:userId`) for conversation history. System prompts are dynamically generated per user, injecting their permission level and workspace path so the LLM has grounded context about its execution environment.

---

## Relevance to Production AI Engineering

| Production Concern | How This Project Addresses It |
|---|---|
| **Multi-Agent / Tool-Use Architecture** | ReAct-style agent loop with 15 registered tools, dynamic tool selection via LLM, and multi-step tool chaining. The tool registry pattern is extensible — adding a new capability means adding a tool definition and handler. |
| **RAG / Context Management** | While not a vector-DB RAG pipeline, the system implements a critical RAG pattern: **dynamic context injection**. System prompts are enriched with OS info, workspace paths, and permission levels. Build logs are fetched and injected as context for RCA. This is runtime retrieval-augmented generation. |
| **FastAPI / API Design** | The tool interface follows OpenAI's function-calling schema, demonstrating API contract design. Each tool has typed parameters, required fields, and enum constraints — the same patterns used in FastAPI endpoint design. |
| **Vertex AI / Cloud LLM** | OpenRouter provides a model-agnostic gateway (similar to Vertex AI's model garden). The codebase is pre-wired for Google Generative AI via `check_models.ts`. Swapping to Vertex AI endpoint would require only a URL and auth change in `openRouter.ts`. |
| **BigQuery / Data Pipeline** | Daily stats are persisted as structured JSON with defined schemas (`DailyStats`, `StoredHealthReport`). The aggregation functions (`getStatsHistory`, `getToolUsageBreakdown`) mirror the kind of analytical queries you'd run in BigQuery. The data model is ready for BigQuery export. |
| **CI/CD Integration** | Deep Netlify integration: deploy, build, env management, function management, and automated deployment monitoring with AI-driven failure analysis. This is production CI/CD observability. |
| **LLMOps** | Conversation history management, reasoning chain preservation, model connectivity health checks, response time tracking, error rate monitoring, multi-format output parsing. These are LLMOps fundamentals. |
| **Observability** | Five-probe health check system, daily stats with time-series persistence, five chart types via QuickChart, startup health DMs to admin, historical trend analysis. Production-grade observability without heavy infrastructure. |
| **Security & IAM** | Four-tier RBAC, per-user workspace sandboxing, path traversal guards, secrets masking in health reports, input sanitization. Demonstrates IAM patterns applicable to any production system. |
| **DevOps** | Cross-platform shell execution, streaming output with rate-limit-aware buffering, daemon-based background processing, environment-based configuration, TypeScript strict mode compilation. |

---

## Project Structure

```
mcp-sandbox/
├── src/
│   ├── index.ts                    # Entry point — starts daemon + Discord bot
│   ├── config/
│   │   └── env.ts                  # Centralized env config with validation
│   ├── core/
│   │   ├── PermissionManager.ts    # RBAC engine (JSON-backed)
│   │   └── WorkspaceManager.ts     # Per-user sandbox directories
│   ├── discord/
│   │   ├── client.ts               # Discord message handler, admin commands
│   │   └── utils.ts                # Code-block-aware message splitter
│   ├── health/
│   │   ├── healthCheck.ts          # 5-probe health system + report persistence
│   │   ├── statsTracker.ts         # Daily metrics recording
│   │   └── chartGenerator.ts       # QuickChart.io visualization engine
│   ├── llm/
│   │   └── openRouter.ts           # LLM gateway + triple-fallback parser
│   ├── services/
│   │   ├── netlifyDaemon.ts        # Background deploy monitor + AI RCA
│   │   ├── netlifyMonitorStore.ts  # Monitored sites persistence layer
│   │   └── netlifyUtils.ts         # Git remote + Netlify API utilities
│   ├── tools/
│   │   ├── index.ts                # Tool registry + dispatcher
│   │   ├── files.ts                # Sandboxed file operations
│   │   ├── shell.ts                # Streaming shell with session state
│   │   ├── search.ts               # Git repo scanner
│   │   ├── netlify.ts              # Netlify CLI wrapper tools (7 tools)
│   │   └── netlifyMonitor.ts       # Deploy monitor management tools
│   └── types/
│       └── toolContext.ts          # Shared context interface
├── health_reports/                 # Persisted health check JSON files
├── index.ts                        # Legacy monolithic entry point
├── check_models.ts                 # Google Generative AI model probe
├── verify_sandbox.ts               # Sandbox security verification tests
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## License

ISC
