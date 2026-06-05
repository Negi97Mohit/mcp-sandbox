# 🔧 Tools Reference

Tools are the "hands" of the AI agents. When an agent needs to do something in the real world — read a file, run a command, call the GitHub API — it emits a **tool call**, which Gaki intercepts and executes on its behalf.

All tools are registered in [`src/tools/index.ts`](../src/tools/index.ts) and dispatched by `executeToolCall()`.

---

## How Tool Calls Work

```
LLM decides to use a tool
          │
          ▼
  Emits tool_call JSON:
  { name: "run_shell", arguments: { command: "npm test" } }
          │
          ▼
executeToolCall(name, args, context)
          │
    Checks registry:
    shellTools? → handleShellCommand()
    fileTools?  → handleFileTool()
    etc.
          │
          ▼
    Result returned to LLM as "tool" message:
    { role: "tool", content: '{ "stdout": "...", "exitCode": 0 }' }
          │
          ▼
    LLM continues reasoning with real-world result
```

If a tool name doesn't exist in the registry, `executeToolCall()` returns `{ error: "Tool X not found" }` — preventing hallucinated tool calls from silently failing.

---

## Built-in Tools

### 🐚 Shell Tool

**File**: [`src/tools/shell.ts`](../src/tools/shell.ts)

#### `run_shell`
Execute any shell command in the current working directory.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `command` | string | ✅ | The shell command to run |

**Returns**:
```json
{
  "stdout": "all output from the command",
  "exitCode": 0,
  "currentDir": "/path/to/current/dir"
}
```

**Key behaviors**:
- Handles `cd` commands specially — updates a persistent in-memory session CWD per channel
- Streams output to Discord in real time (throttled to 1.5s intervals to avoid spam)
- Strips ANSI escape codes from output before sending to Discord
- Sandboxed users: `cd` outside their `workspaceRoot` is blocked with `"Access Denied"`
- Uses `cmd.exe /c` on Windows, `/bin/sh -c` on Unix
- Output truncated to 1500 chars before being returned to the LLM

**Example**:
```
run_shell("git log --oneline -5")
run_shell("npm run build")
run_shell("grep -r 'auth' src/ --include='*.ts'")
```

---

### 📁 File Tools

**File**: [`src/tools/files.ts`](../src/tools/files.ts)

#### `read_file`
Read the full contents of a file.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | string | ✅ | Relative or absolute file path |

**Returns**: `{ content: "file contents as string" }`

---

#### `write_file`
Create or overwrite a file with new content.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | string | ✅ | Relative or absolute file path |
| `content` | string | ✅ | Full content to write |

**Returns**: `{ success: true }` or `{ error: "..." }`

> ⚠️ Creates intermediate directories automatically (`mkdirSync({ recursive: true })`).

---

#### `list_files`
List all files and directories in the current working directory.

| Parameter | Type | Required | Description |
|---|---|---|---|
| *(none)* | — | — | Uses current session CWD |

**Returns**: `{ files: ["file1.ts", "src/", "package.json", ...] }`

---

#### `find_git_repos`
Recursively scan the filesystem for Git repositories.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `start_path` | string | ❌ | Start search from this path (default: user home directory) |

**Returns**: `{ repositories: ["/path/to/repo1", "/path/to/repo2"] }`

**Limits**: Max depth 5, max 20 results. Skips `node_modules`, `dist`, `build`, `.vscode`, `AppData`.

**When to use**: When a user asks about a repo but doesn't specify where it is — "find my mcp-sandbox repo".

---

### 🔀 Git Tools

**File**: [`src/tools/git.ts`](../src/tools/git.ts)

#### `git_stage`
Stage files for commit (`git add`).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `paths` | string[] | ✅ | Array of file paths to stage |

---

#### `git_diff`
Get a diff of staged or unstaged changes.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `staged` | boolean | ❌ | If true, shows `git diff --staged` |

---

#### `git_log`
Get recent commit history.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | number | ❌ | Max number of commits (default: 10) |

---

#### `git_checkout`
Switch or create branches, or restore files.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ref` | string | ✅ | Branch name, commit hash, or `--` for file restore |
| `createBranch` | boolean | ❌ | If true, creates the branch (`-b`) |

---

### 🐙 GitHub Tools

**File**: [`src/tools/github.ts`](../src/tools/github.ts)

These tools require `GITHUB_TOKEN` in your `.env`.

#### `github_get_issue`
Fetch a GitHub issue by number.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `owner` | string | ✅ | Repo owner (e.g., `Negi97Mohit`) |
| `repo` | string | ✅ | Repo name (e.g., `mcp-sandbox`) |
| `issue_number` | number | ✅ | Issue number |

---

#### `github_create_pr`
Open a pull request.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `owner` | string | ✅ | Repo owner |
| `repo` | string | ✅ | Repo name |
| `title` | string | ✅ | PR title |
| `body` | string | ✅ | PR description (Markdown) |
| `head` | string | ✅ | Source branch |
| `base` | string | ✅ | Target branch (usually `main`) |

> ⚠️ This is classified as **HIGH RISK** — always goes through the approval gate.

---

#### `github_read_file`
Read a file from GitHub via the API (without having it locally).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `owner` | string | ✅ | Repo owner |
| `repo` | string | ✅ | Repo name |
| `path` | string | ✅ | File path in the repo |
| `ref` | string | ❌ | Branch or commit (default: `main`) |

---

#### `github_list_issues`
List open issues in a repo.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `owner` | string | ✅ | Repo owner |
| `repo` | string | ✅ | Repo name |
| `state` | string | ❌ | `open`, `closed`, or `all` (default: `open`) |

---

### 🌐 Netlify Tools

**File**: [`src/tools/netlify.ts`](../src/tools/netlify.ts)

Requires `NETLIFY_TOKEN` and optionally `NETLIFY_SITE_ID` in `.env`.

#### `netlify_deploy`
Trigger a new deploy for a Netlify site.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `site_id` | string | ❌ | Netlify site ID (uses env default if not provided) |
| `clear_cache` | boolean | ❌ | Force a clean build (default: false) |

---

#### `netlify_get_sites`
List all Netlify sites for the authenticated account.

*(no parameters)*

---

#### `netlify_get_deploy_status`
Get the current status of the latest deploy.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `site_id` | string | ❌ | Netlify site ID |

---

### 📡 Netlify Monitor Tools

**File**: [`src/tools/netlifyMonitor.ts`](../src/tools/netlifyMonitor.ts)

#### `netlify_watch_deploy`
Poll a deploy until it completes or fails (up to 10 minutes).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `deploy_id` | string | ✅ | The deploy ID to watch |
| `site_id` | string | ❌ | Netlify site ID |

Streams status updates to Discord while polling.

---

### 🔍 Search Tools

**File**: [`src/tools/search.ts`](../src/tools/search.ts)

#### `search_code`
Search for a string pattern across all files in the workspace (grep-style).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | The text or regex pattern to search for |
| `file_pattern` | string | ❌ | Glob to filter files (e.g., `*.ts`) |

**Returns**: Array of `{ file, line, content }` matches.

---

### 🏗️ Project Tools

**File**: [`src/tools/project.ts`](../src/tools/project.ts)

Tools for scaffolding new projects and managing dependencies.

#### `project_init`
Initialize a new Node.js project with `npm init`.

#### `project_install`
Run `npm install [package]` in the workspace.

#### `project_scaffold`
Create a starter file/folder structure for a given framework.

---

### ⚙️ Tool Manager Tools

**File**: [`src/tools/toolManager.ts`](../src/tools/toolManager.ts)

These tools let the AI (or user via UI) manage the custom tools registry at runtime. Requires `admin` role or `canManageTools: true`.

#### `register_custom_tool`
Register a brand-new custom JavaScript tool.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | snake_case tool name (e.g., `fetch_weather`) |
| `description` | string | ✅ | What the tool does |
| `parameters` | array | ✅ | Parameter definitions (name, type, description, required) |
| `code` | string | ✅ | Async JavaScript code. Set `result` variable with the output. |

**Example code**:
```javascript
const response = await fetch(`https://api.weather.com?city=${city}`);
const data = await response.json();
result = { temperature: data.temp, condition: data.condition };
```

---

#### `update_custom_tool`
Update an existing custom tool's description, parameters, or code.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Name of the tool to update |
| `description` | string | ❌ | New description |
| `parameters` | array | ❌ | New parameter definitions |
| `code` | string | ❌ | New JavaScript code |

---

#### `delete_custom_tool`
Delete a custom tool permanently.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Tool name to delete |

---

## Custom Tools Engine

**File**: [`src/core/CustomToolsEngine.ts`](../src/core/CustomToolsEngine.ts)

Custom tools are persisted as JSON (in `adapter_configs.json`) and loaded at startup. When executed, the tool's JavaScript `code` string is run in a sandboxed Node.js `vm` context.

```javascript
// Internal execution model
const sandbox = { result: undefined, fetch, console, ...utils };
vm.runInNewContext(`(async () => { ${tool.code} })()`, sandbox);
return sandbox.result;
```

Console logs from custom tool code are captured and included in the return value, so the LLM sees any `console.log()` output from the tool.

---

## Tool Context

Every tool call receives a `ToolContext` object:
```typescript
interface ToolContext {
  channelId: string;       // Discord channel or "desktop" for Electron
  userId: string;          // Discord user ID or "desktop-admin"
  workspaceRoot?: string;  // Sandbox root path for this user (if sandboxed)
  sendLog: (msg: string) => Promise<void>;  // Live-stream logs to Discord/UI
}
```

`workspaceRoot` is used by the shell and file tools to enforce sandbox boundaries — if set, any path navigation outside it is rejected with `"Access Denied"`.
