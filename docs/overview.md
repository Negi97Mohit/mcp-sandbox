# 🤖 Gaki — What Is This Thing?

## In Plain English

Imagine you have a super-smart intern who can read your entire codebase, figure out what needs to be changed, actually change it, and then double-check their own work — all without you having to micromanage every step. That's Gaki.

You describe a problem in plain language — like *"Fix the login bug where users get logged out randomly"* — and Gaki figures out:
- Which files to look at
- What the actual fix should be
- How to implement it safely
- Whether the fix actually works

If it's confident enough (≥85%), it even opens a Pull Request automatically. If it's unsure, it asks you to review first. If something looks risky, it pings you on Discord before touching anything.

---

## What Problem Does It Solve?

Modern software teams spend a huge amount of time on **repetitive engineering work** — bug fixes, refactors, code reviews, deployments. Gaki automates the full cycle:

| Without Gaki | With Gaki |
|---|---|
| Engineer reads issue → manually finds relevant files | Gaki scans the codebase automatically |
| Engineer writes fix → hopes it's correct | Gaki writes the fix and runs type-checks |
| Another engineer reviews the PR | Gaki scores its own confidence and flags if review needed |
| DevOps deploys to Netlify | Gaki can trigger Netlify deploys directly |
| Team gets no visibility into what changed | Gaki logs every step to Discord + dashboard |

---

## Two Ways to Use It

### 🖥️ Desktop App (Recommended)
A visual interface built with Electron + React. You get:
- A dashboard to see what the AI is doing in real time
- A code diff viewer to see changes before approving them
- A "Custom Tools Studio" to add new capabilities to the AI
- Environment variable management without restarting anything

### 💬 Discord Bot
Type commands in your Discord server and Gaki responds. Great for teams — everyone can see what the agent is doing. You can approve or reject changes right from Discord using reactions (✅/❌).

---

## How Smart Is It?

Gaki doesn't just blindly execute — it has a **confidence scoring system**:
- **≥ 85% confident + all tests pass** → Creates a PR automatically
- **60–84% confident** → Asks you to review the diff first
- **< 60% confident** → Admits it's not sure and escalates to you

This prevents the classic AI problem of confidently writing wrong code and silently breaking things.

---

## Key Concepts at a Glance

| Concept | What It Means |
|---|---|
| **Orchestrator** | The "brain" that coordinates all the other agents |
| **PlannerAgent** | Reads your code and figures out *what* needs to change |
| **ImplementerAgent** | Actually makes the changes |
| **VerifierAgent** | Runs tests and checks if the changes work |
| **Human-in-the-Loop Gate** | A safety pause that asks you before risky actions |
| **RBAC** | Role-based access control — who's allowed to do what |
| **Custom Tools Studio** | Add new capabilities to the AI through the UI |

---

## What It Can Do (Features List)

- ✅ Read and understand any codebase
- ✅ Write, edit, and create files
- ✅ Run shell commands (npm, git, compilers)
- ✅ Stage Git changes and create Pull Requests
- ✅ Deploy to Netlify
- ✅ Create GitHub Issues and PRs
- ✅ Monitor Netlify deployment status
- ✅ Hot-reload configuration (no restarts needed)
- ✅ Role-based permissions per Discord user
- ✅ Live streaming logs to Discord
- ✅ AI-powered tool explanation and modification
- ✅ Duplicate command detection (loop prevention)
- ✅ Confidence scoring with decision thresholds
- ✅ Distributed tracing for observability

---

## Navigation

- [Architecture](./architecture.md) — How all the pieces fit together (technical)
- [Agents](./agents.md) — Deep dive on each AI agent
- [Tools](./tools.md) — All the tools agents can use
- [Permissions & RBAC](./permissions.md) — Who can do what
- [Discord Bot](./discord-bot.md) — Commands and Discord-specific features
- [Configuration](./configuration.md) — Setup and environment variables
- [Use Cases](./use-cases.md) — Real-world examples
