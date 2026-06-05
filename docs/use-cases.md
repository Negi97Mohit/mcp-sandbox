# 🎯 Use Cases — Real-World Scenarios

This document walks through concrete, real-world scenarios where Gaki adds the most value. Each one includes what you'd type, what Gaki does internally, and what the outcome looks like.

---

## Use Case 1: Fix a Bug from a GitHub Issue

**Scenario**: A user files GitHub Issue #42: *"Login page crashes with null reference when session expires."*

### What You Type
```
!agent Fix GitHub issue #42 in Negi97Mohit/mcp-sandbox — null reference on login page
```

### What Gaki Does
1. **PlannerAgent** calls `github_get_issue(42)` to read the issue description
2. Searches the codebase: `search_code("session", "*.ts")`
3. Reads the relevant file: `read_file("src/auth/login.ts")`
4. Produces a 3-step plan:
   ```
   PLAN:
   1. Add null guard for user session object on line 42 — Tool: write_file, File: src/auth/login.ts
   2. Run type check to verify no new errors — Tool: run_shell, File: N/A
   3. Stage changes — Tool: run_shell, File: N/A
   CONFIDENCE: 0.82
   ```

5. **ImplementerAgent** reads the current file, applies the null guard, runs `npm run build`
6. **VerifierAgent** runs `npm test` → 12/12 tests pass → Confidence: 0.88

7. **Decision**: 0.88 ≥ 0.85 → Auto-commit triggered
8. Approval gate: Discord embed sent → You react ✅
9. GitHub PR created: `fix: null reference in login page (#42)`

### Outcome
- PR is live in under 5 minutes
- No files touched manually
- Full audit trail in Discord

---

## Use Case 2: Onboard a Remote Developer

**Scenario**: A new developer joins the team remotely. They don't have the repo locally but have Discord access.

### What You (Admin) Do
```
!grant @newdev write
```

### What Gaki Does Automatically
1. Creates a new isolated workspace: `workspaces/ws-newdev-id/`
2. The new developer can now use the bot

### What the New Developer Experiences
```
newdev: find my project repos
Bot: 🔎 Searching for Git repos starting at: C:/Users/newdev/
Bot: ✅ Found 3 repos:
     - C:/Users/newdev/projects/frontend
     - C:/Users/newdev/projects/api
     - C:/Users/newdev/Documents/sandbox

newdev: cd into the api project and show me recent commits
Bot: 📂 Changed directory to: C:/Users/newdev/projects/api
Bot: > git log --oneline -5
     a1b2c3 fix: rate limiting on /auth endpoint
     d4e5f6 feat: add refresh token support
     ...
```

Their shell session is sandboxed — they can't navigate outside their workspace even if they try `cd /../../etc`.

---

## Use Case 3: Deploy and Monitor a Netlify Site

**Scenario**: You've just merged a PR and want to deploy the frontend + watch the build.

### What You Type
```
!agent deploy my Netlify site and watch the build until it's done
```

### What Gaki Does
1. **PlannerAgent**: Identifies this as a deployment task, no code changes needed
2. **ImplementerAgent**:
   - Calls `netlify_get_sites()` to find your site
   - Calls `netlify_deploy({ site_id: "abc-123", clear_cache: false })`
   - Gets back `deploy_id: "deploy-xyz789"`
   - Calls `netlify_watch_deploy({ deploy_id: "deploy-xyz789" })`

3. Streams status updates to Discord:
```
Bot: 🚀 Deploy triggered: deploy-xyz789
Bot: ⏳ Status: building (0:32 elapsed)
Bot: ⏳ Status: building (1:15 elapsed)
Bot: ⏳ Status: processing (2:03 elapsed)
Bot: ✅ Deploy complete! Live at: https://your-site.netlify.app
     Build time: 2m 14s
```

### Outcome
You get real-time build progress without leaving Discord.

---

## Use Case 4: Add a Custom Tool via the Desktop UI

**Scenario**: You want Gaki to be able to fetch cryptocurrency prices on demand.

### Steps in the Desktop App
1. Open the **Custom Tools Studio** tab
2. Click **"AI Tool Generator"**
3. Fill in the form:
   - **Tool Name**: `fetch_crypto_price`
   - **Description**: `Fetch the current USD price of a cryptocurrency`
   - **Parameters**: `symbol` (string, required) — "Cryptocurrency symbol e.g. BTC, ETH"
   - **API URL**: `https://api.coingecko.com/api/v3/simple/price?ids={symbol}&vs_currencies=usd`
   - **Expected Response**: `{ bitcoin: { usd: 45000 } }`
4. Click **"Generate Tool"**

### What Gaki Generates
```javascript
// Auto-generated tool code
const symbolMap = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' };
const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
const response = await fetch(
  `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
);
const data = await response.json();
result = {
  symbol: symbol.toUpperCase(),
  priceUSD: data[coinId]?.usd ?? 'Not found'
};
```

5. Review the generated code in the preview panel
6. Click **"Register Tool"** — it's saved to `adapter_configs.json` and immediately available

### Using It via Discord
```
You: what's the price of ETH right now?
Bot: ⚙️ Thinking... then running fetch_crypto_price
Bot: Ethereum (ETH) is currently trading at $3,420.15 USD.
```

---

## Use Case 5: Understand a Tool You've Never Seen

**Scenario**: You inherited a codebase and there's a tool called `netlify_watch_deploy` — you have no idea what it does or how to use it.

### Steps in the Desktop App
1. Open **Custom Tools Studio**
2. Find `netlify_watch_deploy` in the tool list
3. Click the ✨ **Sparkles icon**

### What Gaki Generates
An AI-written guide appears in the drawer:

```markdown
## netlify_watch_deploy

**What it does**: Polls a Netlify deploy until it reaches a terminal state
(success or failure), streaming live status updates along the way.
Useful when you need to wait for a deploy to complete before proceeding.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `deploy_id` | string | ✅ | The unique ID of the deploy to watch |
| `site_id` | string | ❌ | Your Netlify site ID. Falls back to NETLIFY_SITE_ID in .env |

## Returns

```json
{ "status": "ready", "deployUrl": "https://your-site.netlify.app", "buildTimeMs": 134000 }
```

## Example (Discord)
```
!agent watch deploy deploy-abc123 on site xyz-456
```

## Example (Direct Tool Call)
```json
{ "name": "netlify_watch_deploy", "arguments": { "deploy_id": "deploy-abc123" } }
```

**Timeout**: Polls for up to 10 minutes. Sends status every 30 seconds.
```

---

## Use Case 6: Refactor a File Safely

**Scenario**: You want to refactor `src/services/userService.ts` to use async/await instead of Promise chains — but you're worried about breaking things.

### What You Type
```
!agent refactor src/services/userService.ts to use async/await instead of .then() chains
```

### What Gaki Does

1. **PlannerAgent** reads the file, identifies all `.then()` chains, and produces a step-by-step plan with confidence 0.78

2. **ImplementerAgent** rewrites each function, then runs `npm run build` to verify

3. **VerifierAgent** runs:
   - `tsc --noEmit` → passes
   - `npm test` → 8/8 tests pass
   - Logic review: confirms the async/await patterns are correct
   - Confidence: 0.82

4. **Decision**: 0.82 ≥ 0.60 but < 0.85 → `request_approval`

5. Bot sends a **diff view** to Discord:
```
Bot: 📋 Changes ready for review (Confidence: 82%)
     Please check the diff and approve or reject:

     diff --git a/src/services/userService.ts
     - return db.find(id).then(user => {
     -   return user.toJSON();
     - });
     + const user = await db.find(id);
     + return user.toJSON();

     [✅ Approve] [❌ Reject]
```

6. You review and approve → Git commits the change

### Why Confidence Was 0.82 Not 0.88+

The Verifier noticed 2 edge cases in error handling that weren't tested — it noted them in the verification summary. That's why it stopped short of auto-commit and asked you to review.

---

## Use Case 7: Run the Eval Suite Before a Release

**Scenario**: You're about to push a new release and want to make sure nothing is broken.

### What You Type (Discord)
```
!eval
```

### What Gaki Does
Runs 20 pre-defined test cases from `src/evals/`:

```
Bot: 🧪 Running evaluation suite (20 tests)...

     ✅ shell.basic          — run_shell returns stdout correctly
     ✅ shell.cd             — directory changes persist per session
     ✅ shell.timeout        — commands respect timeout limits
     ✅ file.write_read      — write then read returns same content
     ✅ file.mkdir           — nested directories created automatically
     ✅ security.traversal1  — cd ../../../etc/passwd → Access Denied
     ✅ security.traversal2  — write_file /etc/hosts → Access Denied
     ✅ git.stage            — git add stages correctly
     ✅ git.diff             — diff returns changed lines
     ✅ tools.unknown        — unknown tool returns error, not crash
     ✅ agent.loop_detect    — duplicate tool call triggers abort
     ✅ agent.max_steps      — 11-step task aborts at step 10
     ❌ netlify.deploy       — NETLIFY_TOKEN not set (expected)
     ✅ github.read_issue    — can fetch public issue
     ... (6 more)

     Score: 18/20 (90%) ✅ PASS
     (2 skipped: Netlify tests require NETLIFY_TOKEN)
```

A score ≥ 80% is required to "pass" the suite.

---

## Use Case 8: Team Collaboration — Multiple Developers on Discord

**Scenario**: A team of 3 developers all use the same Discord server. Each person gets their own isolated sandbox.

### Admin Setup
```
!grant @alice write
!grant @bob write
!grant @carol read
```

### How Each Person Experiences It
- **Alice** and **Bob** each get their own `workspaces/ws-{their-id}/` folder
- **Carol** can ask questions and get code explanations but can't run agents that modify files
- If **Alice** types `cd ..` and tries to get into **Bob**'s workspace — blocked
- An admin (you) can see everyone's workspace and activity via `!history`

### What It Looks Like in Discord
```
#dev-bot channel:

alice: !agent add input validation to the signup form in my project
Bot: 🎯 Orchestrator | Task task-1717...
     Working in: workspaces/ws-alice-123/

bob: !agent fix the API rate limiting bug
Bot: 🎯 Orchestrator | Task task-1717...
     Working in: workspaces/ws-bob-456/

carol: what does the auth middleware do?
Bot: The auth middleware in your project checks the JWT token on every
     protected route. It reads the token from the Authorization header,
     verifies it against...
```

Both tasks run concurrently. Each bot response is threaded to the appropriate channel message to avoid confusion.
