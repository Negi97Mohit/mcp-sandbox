# 📚 Gaki Documentation

Welcome to the complete documentation for **Gaki** — an autonomous multi-agent AI engineering studio.

---

## 📖 Documents

| Document | Who It's For | What's Inside |
|---|---|---|
| [Overview](./overview.md) | Everyone | Plain-English explanation of what Gaki is and does |
| [Architecture](./architecture.md) | Developers | Technical deep-dive: system design, data flow, LLM loop |
| [Agents](./agents.md) | Developers | Each agent's role, tools, output format, and constraints |
| [Tools Reference](./tools.md) | Developers | Every tool: parameters, return values, and examples |
| [Permissions & RBAC](./permissions.md) | Admins | User roles, workspace isolation, approval gate |
| [Discord Bot](./discord-bot.md) | All Users | Commands, live streaming, reaction approvals |
| [Desktop App](./desktop-app.md) | All Users | Dashboard, Custom Tools Studio, settings |
| [Configuration](./configuration.md) | Developers | `.env` variables, model selection, hot-reload |
| [Use Cases](./use-cases.md) | Everyone | 8 real-world scenarios with step-by-step walkthroughs |
| [Safety & Security](./safety-and-security.md) | Everyone | Loop prevention, hallucination guards, sandbox security |

---

## ⚡ Quick Start (30 seconds)

```bash
git clone https://github.com/Negi97Mohit/mcp-sandbox.git
cd mcp-sandbox
npm install && cd desktop-ui && npm install && cd ..
cp .env.example .env
# Fill in OPENROUTER_API_KEY, DISCORD_TOKEN, ALLOWED_USER_ID in .env
npm run dev:desktop        # Desktop app
# OR
npm run dev                # Discord bot only
```

---

## 🗺️ Key Concepts — 60 Second Tour

```
You type:  "!agent fix the auth bug"
                   │
         ┌─────────▼──────────┐
         │    Orchestrator    │  ← Coordinates everything
         └─────────┬──────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
  Planner     Implementer   Verifier
 (reads code) (writes code)  (runs tests)
      │            │            │
   Plan.md     file edits    confidence
      └────────────┴────────────┘
                   │
            Decision Engine
         ≥0.85 → Auto PR
         ≥0.60 → Ask human
          <0.60 → Escalate
```

**Three worker agents** each have limited permissions. The **Orchestrator** coordinates them. The **Decision Engine** decides what happens based on real test results, not guesses.

---

## 🔑 The 5 Things That Make Gaki Different

1. **Confidence Scoring** — Decisions are based on actual test pass/fail counts, not LLM self-assessment
2. **Loop Prevention** — Max step limits + duplicate command detection stop runaway agents
3. **Layered Permissions** — Each agent can only use tools appropriate to its role (planner = read-only, etc.)
4. **Human-in-the-Loop Gate** — High-risk actions always require explicit approval, with auto-rollback on timeout
5. **Hot Config Reload** — Update `.env` (API keys, model name) with zero downtime

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v20+ |
| Language | TypeScript |
| Desktop | Electron + React + Vite |
| Discord | discord.js v14 |
| LLM | OpenRouter API (200+ models) |
| Git | simple-git |
| CI/Deploy | Netlify |
| Auth | Firebase Admin SDK (optional) |
| Charts | Recharts |
| Build | tsc (TypeScript compiler) |
