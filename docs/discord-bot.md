# 💬 Discord Bot — Commands & Usage

The Discord bot is the primary way to interact with Gaki without opening the desktop app. It streams live logs, supports reaction-based approvals, and exposes all admin commands.

---

## In Plain English

Add the bot to your Discord server, give it the right channel permissions, and you can literally chat with your codebase. Type `!agent fix the login bug` and watch it plan, implement, and verify the fix — all inside Discord.

---

## Setup

### 1. Create a Discord Application
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application → Bot tab → "Add Bot"
3. Copy the **Bot Token** → paste into `.env` as `DISCORD_TOKEN`
4. Under OAuth2 → URL Generator → select `bot` scope
5. Bot permissions needed: `Read Messages`, `Send Messages`, `Add Reactions`, `Manage Messages`

### 2. Enable Message Content Intent
In the Bot settings, enable **"Message Content Intent"** — without this, the bot can't read what you type.

### 3. Set Your User ID
Get your Discord user ID (enable Developer Mode → right-click your name → "Copy ID") and set it as `ALLOWED_USER_ID` in `.env`. This makes you the super admin.

### 4. Start the Bot
```bash
npm run dev
```
Look for: `🤖 Reasoning Bot Online: YourBot#1234`

---

## How to Talk to the Bot

### Simple Chat
Just send a message in any channel where the bot has access. It maintains per-channel conversation history, so follow-up questions work naturally.

```
You: what files are in the project root?
Bot: ⚙️ Thinking... then running list_files
Bot: I found these files: index.ts, package.json, src/, electron/, ...
```

### Run the Full Agent Pipeline
```
!agent <task description>
```

This triggers the full **Plan → Implement → Verify → Decide** pipeline.

```
You: !agent fix the null pointer error in src/auth/login.ts
Bot: 🎯 Orchestrator | Task task-1717484400-abc1
     📋 Request: fix the null pointer error in src/auth/login.ts

Bot: 🧠 Phase 1/3: PlannerAgent analyzing codebase...
Bot: > git log --oneline -5
Bot: ```text
     a1b2c3d fix: update session handler
     e4f5g6h feat: add OAuth2 support
     ```

Bot: ✅ Plan ready | 3 steps | Confidence: 82%

Bot: ⚙️ Phase 2/3: ImplementerAgent executing plan...
Bot: ✍️ Wrote file: src/auth/login.ts
Bot: ✅ Implementation done | Files: src/auth/login.ts

Bot: 🔬 Phase 3/3: VerifierAgent running tests...
Bot: 🔬 Verification: Confidence 88% | Tests: 12/12 passing

Bot: 🟠 Approval Required: Creating PR is a high-risk action.
     [Discord embed with ✅/❌ buttons]

You: [reacts ✅]
Bot: ✅ PR Created: https://github.com/Negi97Mohit/mcp-sandbox/pull/42
```

---

## Admin Commands

These commands only work if you are the super admin (`ALLOWED_USER_ID`) or have `admin` role.

### Permission Management

```bash
# Grant a user a role
!grant @username write
!grant @username admin
!grant @username read

# Revoke all access from a user
!revoke @username

# List all users and their roles
!permissions list
```

### Health & Diagnostics

```bash
# Show system health (CPU, uptime, API status, DB metrics)
!health

# Show recent command/task history
!history

# Show usage stats (tool call counts, response times)
!stats
```

### Evaluation / Testing

```bash
# Run the full 20-case regression test suite
!eval

# Run a specific category of tests
!eval --category shell
!eval --category git
!eval --category security
```

---

## Live Log Streaming

When the agent is working, it streams step-by-step updates directly into the channel. You don't have to wait for a final answer — you can watch it think.

Example stream:
```
⚙️ Thinking... then running read_file
📂 Changed directory to: /workspace/src/auth
> npm run build
```text
src/auth/login.ts(42,15): error TS2345: Argument of type 'null' is not assignable...
[Process exited with code 1]
```
```

Each code block output is throttled to one message per 1.5 seconds to avoid rate limiting.

---

## Reaction-Based Approvals

When a high-risk action is pending (e.g., creating a PR, deploying to Netlify), the bot pauses and sends an embed:

```
┌────────────────────────────────────────────┐
│ ⚠️ Gaki — Action Approval Required         │
│                                            │
│ Action:     Create PR "fix: auth null ref" │
│ Risk Level: 🔴 HIGH                        │
│ Requested:  @mohit                         │
│ Expires:    5 minutes                      │
│                                            │
│ Context:                                   │
│ All 12 tests passing. Confidence: 88%.     │
│ Modified: src/auth/login.ts                │
│                                            │
│ ✅ = Approve    ❌ = Reject                │
└────────────────────────────────────────────┘
```

- React ✅ → Action proceeds
- React ❌ → Action aborted, changes rolled back
- No reaction within 5 min → Auto-rejected, changes rolled back

Only the user who triggered the request can approve (verified by `requestedBy` field).

---

## Conversation Memory

Each Discord **channel** has its own conversation history. The bot remembers what was said in the current session.

- History is stored in a `Map<channelId, messages[]>`
- Sliding window: last **10 turns** are kept (older ones dropped)
- System prompt is re-injected on every API call (prevents drift)
- History resets when the bot restarts

> **Tip**: Use different channels for different projects to keep contexts separate.

---

## Reasoning Display

When using a model that supports chain-of-thought (DeepSeek, Nvidia Nemotron, etc.), the bot can show the model's internal reasoning:

```
||**My Thoughts:**
The error on line 42 is likely because `user` can be null when the session expires
before the token is checked. I should add a null guard: `if (!user) return...`||

Here's what I found and fixed: ...
```

The reasoning is wrapped in Discord spoiler tags (`||text||`) so it's hidden by default — click to expand.

---

## DM Support

The bot works in Direct Messages too. Send it a DM for private interactions. Same commands, same permissions — but a separate conversation history from any server channel.

---

## Troubleshooting

### Bot doesn't respond
- Check `DISCORD_TOKEN` is correct in `.env`
- Verify "Message Content Intent" is enabled in Discord developer portal
- Make sure your user ID is set as `ALLOWED_USER_ID` or you've been granted access

### Bot responds with "Access Denied"
- Your Discord user ID hasn't been granted permissions
- Ask an admin to run `!grant @you write`

### Bot times out mid-task
- Long tasks (multi-file changes + tests) can take 2–5 minutes
- The bot will still complete and post results — just wait
- If it errors, check the terminal for stack traces

### Messages cut off at 2000 chars
- Discord's message limit is 2000 characters
- Gaki automatically splits long responses into multiple messages
