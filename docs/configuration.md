# ⚙️ Configuration Guide

Everything in Gaki is controlled through environment variables. The system hot-reloads the config file whenever it changes — no restarts needed.

---

## Quick Start

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Open and fill in your keys
notepad .env      # Windows
nano .env         # Mac/Linux

# 3. Start Gaki
npm run dev               # Discord bot + CLI
npm run dev:desktop       # Electron desktop app
```

---

## All Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter API key — used for all LLM calls | `sk-or-v1-abc123...` |
| `DISCORD_TOKEN` | Your Discord bot token | `MTIz...` |
| `ALLOWED_USER_ID` | Your Discord user ID — makes you the super admin | `123456789012345678` |

### Recommended

| Variable | Description | Default |
|---|---|---|
| `MODEL_NAME` | The LLM model to use via OpenRouter | `nvidia/nemotron-3-nano-30b-a3b:free` |
| `GITHUB_TOKEN` | GitHub Personal Access Token for PR/issue tools | *(empty — GitHub tools disabled)* |
| `NETLIFY_TOKEN` | Netlify API token for deploy tools | *(empty — Netlify tools disabled)* |
| `NETLIFY_SITE_ID` | Default site ID for Netlify deploys | *(empty)* |

### Optional

| Variable | Description | Default |
|---|---|---|
| `MAX_AGENT_STEPS` | Max tool calls per agent run | `10` |
| `HISTORY_WINDOW` | Number of conversation turns to keep | `10` |
| `APPROVAL_TIMEOUT_MS` | How long to wait for human approval (ms) | `300000` (5 min) |
| `AUTO_COMMIT_THRESHOLD` | Min confidence for auto PR creation | `0.85` |
| `APPROVAL_THRESHOLD` | Min confidence to request approval (vs escalate) | `0.60` |

---

## The `.env.example` File

This is the template for all required keys:

```env
# ═══════════════════════════════════════════════════════════
# CORE — Required for basic operation
# ═══════════════════════════════════════════════════════════

# Get your key at: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Get from Discord Developer Portal → Your App → Bot → Token
DISCORD_TOKEN=your-discord-bot-token-here

# Your own Discord user ID (enable Dev Mode → right-click name → Copy ID)
ALLOWED_USER_ID=your-discord-user-id-here

# Model to use. Browse models at: https://openrouter.ai/models
# Free option: nvidia/nemotron-3-nano-30b-a3b:free
# Better option: anthropic/claude-3-5-haiku
# Best option: anthropic/claude-sonnet-4-5
MODEL_NAME=nvidia/nemotron-3-nano-30b-a3b:free

# ═══════════════════════════════════════════════════════════
# GITHUB — Required for PR and issue tools
# ═══════════════════════════════════════════════════════════

# Create at: https://github.com/settings/tokens
# Scopes needed: repo, read:user
GITHUB_TOKEN=ghp_your-github-token-here

# ═══════════════════════════════════════════════════════════
# NETLIFY — Required for deploy tools
# ═══════════════════════════════════════════════════════════

# Create at: https://app.netlify.com/user/applications#personal-access-tokens
NETLIFY_TOKEN=your-netlify-token-here

# Find in Netlify dashboard → Site Settings → General → Site ID
NETLIFY_SITE_ID=your-site-id-here
```

---

## Choosing a Model

Gaki works with any model on OpenRouter. Here's a practical guide:

| Model | Speed | Quality | Cost | Best For |
|---|---|---|---|---|
| `nvidia/nemotron-3-nano-30b-a3b:free` | Fast | Moderate | Free | Development/testing |
| `anthropic/claude-3-5-haiku` | Fast | Good | Low | Daily use |
| `anthropic/claude-sonnet-4-5` | Medium | Excellent | Medium | Complex tasks |
| `openai/gpt-4o` | Medium | Excellent | Medium | Balanced |
| `deepseek/deepseek-r1` | Slow | Very Good | Low | Reasoning tasks |

Change the model in `.env` and it takes effect immediately (hot-reload) — no restart needed.

---

## Hot Reload — How It Works

One of Gaki's most useful features: edit `.env` and changes take effect within seconds without restarting the bot or the desktop app.

```typescript
// From index.ts — watches the .env file for changes
fs.watch(".env", (eventType) => {
  if (eventType === "change") {
    dotenv.config({ override: true });   // Re-read the file
    OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
    DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
    MODEL_NAME = process.env.MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free";
    console.log("♻️  Config reloaded from .env");
  }
});
```

**When to use this**: If your API key expires mid-session, update it in `.env` — the next request will use the new key without any downtime.

**What gets reloaded**: All `process.env.*` values including API keys, model name, and user ID.

**What does NOT get reloaded**: Firebase service account, workspace structure, already-running agent tasks.

---

## Firebase Setup (Optional)

Firebase is used for persistent data storage (logs, stats, permissions) if you want to preserve data across restarts.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Go to Project Settings → Service Accounts → Generate New Private Key
3. Save the downloaded JSON as `service-account.json` in the project root
4. Gaki auto-detects it at startup:
   ```
   🔥 Firebase Admin SDK: Connected
   ```

Without `service-account.json`, Gaki falls back to in-memory/file-based storage (still fully functional, but data is lost on restart).

---

## TypeScript Configuration

**File**: [`tsconfig.json`](../tsconfig.json)

Key settings:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

All `.ts` files compile to `.js` in the same directory (not a separate `dist/` folder) using `tsc`. The compiled `.js` and `.d.ts` files are what actually runs.

---

## NPM Scripts

```bash
# Start the Discord bot and CLI
npm run dev

# Start the Electron desktop app + React UI
npm run dev:desktop

# Compile TypeScript
npm run build

# Run the eval suite (20 regression tests)
npm run eval

# Run eval for a specific category
npm run eval -- --category shell
npm run eval -- --category security

# Check model API connectivity
npx ts-node check_models.ts

# Run sandbox health checks
npx ts-node verify_sandbox.ts
```

---

## Desktop App — Additional Setup

The desktop app (`npm run dev:desktop`) requires the React frontend to be installed:

```bash
# Install frontend dependencies (first time only)
cd desktop-ui
npm install
cd ..

# Then run both together
npm run dev:desktop
```

The Electron process serves the React app via Vite dev server. Changes to React components hot-reload instantly in the window.

---

## Adapter Configs

**File**: [`adapter_configs.json`](../adapter_configs.json)

Stores custom tools registered through the Custom Tools Studio. Format:
```json
{
  "customTools": [
    {
      "id": "tool-uuid",
      "name": "fetch_weather",
      "description": "Fetch current weather for a city",
      "parameters": [
        { "name": "city", "type": "string", "description": "City name", "required": true }
      ],
      "code": "const res = await fetch(`https://api.weather.com?q=${city}`); result = await res.json();"
    }
  ]
}
```

This file is auto-managed by the Custom Tools Studio — you don't need to edit it manually.
