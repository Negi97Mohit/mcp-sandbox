import { Client, GatewayIntentBits, Partials, Message, TextChannel, EmbedBuilder, MessageReaction, User, } from "discord.js";
import { CONFIG } from "../config/env.js";
import { callOpenRouter } from "../llm/openRouter.js";
import { executeToolCall } from "../tools/index.js";
import { smartSplitMessage } from "./utils.js";
import { permissionManager } from "../core/PermissionManager.js";
import { workspaceManager } from "../core/WorkspaceManager.js";
import { workspaceStore } from "../core/WorkspaceStore.js";
import { approvalGate } from "../core/approvalGate.js";
import { orchestrator } from "../agents/orchestrator.js";
import { graphStore } from "../core/GraphStore.js";
import { generateHealthReport, generateHistoryEmbed } from "../health/healthCheck.js";
import { recordMessage, recordToolCall, recordError, recordResponseTime } from "../health/statsTracker.js";
import { generateChartEmbeds, generateStatsEmbed } from "../health/chartGenerator.js";
import { runEvalSuite } from "../evals/evalRunner.js";
import { formatDiscordReport } from "../evals/evalReport.js";
const logDebug = (msg) => {
    console.log(msg);
};
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions, // needed for approval gate ✅/❌
    ],
    partials: [Partials.Channel, Partials.Reaction, Partials.Message],
});
// Per-user/channel conversation history
const chatHistory = new Map();
// ── Bot Ready ──────────────────────────────────────────────────────────────
client.once("ready", async () => {
    const { allTools } = await import("../tools/index.js");
    console.log(`🤖 Multi-Agent Bot Online: ${client.user?.tag}`);
    console.log(`🔧 Tools registered: ${allTools.length}`);
    await sendStartupHealthReport();
});
// ── Approval Gate Reaction Handler ─────────────────────────────────────────
// Listens for ✅/❌ on approval embed messages and resolves pending approvals.
client.on("messageReactionAdd", async (rawReaction, rawUser) => {
    if (rawUser.bot)
        return;
    if (rawReaction.partial) {
        try {
            await rawReaction.fetch();
        }
        catch {
            return;
        }
    }
    const emoji = rawReaction.emoji.name ?? "";
    if (emoji !== "✅" && emoji !== "❌")
        return;
    const isAdmin = permissionManager.isAdmin(rawUser.id);
    const handled = await approvalGate.handleReaction(rawReaction.message.id, emoji, rawUser.id, isAdmin);
    if (handled) {
        const word = emoji === "✅" ? "approved ✅" : "rejected ❌";
        rawReaction.message.reply(`🔐 Action **${word}** by <@${rawUser.id}>`).catch(() => { });
    }
});
// ── Message Router ─────────────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
    logDebug(`[messageCreate Event] Fired! Author: ${message.author.tag} (${message.author.id}), Bot: ${message.author.bot}`);
    try {
        await handleMessage(message);
    }
    catch (e) {
        logDebug(`[messageCreate Event Error] Fatal error in event handler: ${e.message}`);
    }
});
// ── Admin + Special Command Handler ───────────────────────────────────────
async function handleAdminCommand(message) {
    const args = message.content.trim().split(/\s+/);
    const command = (args[0] ?? "").toLowerCase();
    const adminId = message.author.id;
    if (!permissionManager.isAdmin(adminId)) {
        await message.reply("❌ You do not have permission to run admin commands.");
        return;
    }
    graphStore.addNode({
        type: "user_action",
        label: `Admin Command: ${command}`,
        status: "success",
        createdBy: `discord:${message.author.username}`,
        colorCode: "rose",
        details: { description: message.content }
    });
    try {
        // ── RBAC Management ────────────────────────────────────────────
        if (command === "!grant") {
            const targetUser = message.mentions.users.first();
            const role = args[2];
            if (!targetUser || !["read", "write", "admin"].includes(role)) {
                await message.reply("Usage: `!grant @user <read|write|admin>`");
                return;
            }
            permissionManager.grant(adminId, targetUser.id, role);
            workspaceManager.ensureWorkspace(targetUser.id);
            await message.reply(`✅ Granted **${role}** access to ${targetUser.tag}`);
            return;
        }
        if (command === "!revoke") {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply("Usage: `!revoke @user`");
                return;
            }
            permissionManager.revoke(adminId, targetUser.id);
            await message.reply(`🚫 Revoked access from ${targetUser.tag}`);
            return;
        }
        if (command === "!permissions") {
            const allUsers = permissionManager.listAll();
            if (allUsers.length === 0) {
                await message.reply("No users have been granted access yet.");
                return;
            }
            const lines = allUsers.map((u) => `• <@${u.userId}>: **${u.role}**`).join("\n");
            await message.reply(`📋 **User Permissions:**\n${lines}`);
            return;
        }
        if (command === "!workspace" && args[1] === "create") {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply("Usage: `!workspace create @user`");
                return;
            }
            const wsPath = workspaceManager.ensureWorkspace(targetUser.id);
            await message.reply(`📂 Workspace created at: \`${wsPath}\``);
            return;
        }
        // ── Observability ──────────────────────────────────────────────
        if (command === "!health") {
            await message.reply("🔍 Running health checks...");
            const { embed } = await generateHealthReport();
            await message.reply({ embeds: [embed] });
            return;
        }
        if (command === "!history") {
            const days = parseInt(args[1] ?? "7", 10) || 7;
            await message.reply(`📊 Fetching health report history (last ${days} days)...`);
            const embed = await generateHistoryEmbed(days);
            await message.reply({ embeds: [embed] });
            return;
        }
        if (command === "!stats") {
            const days = parseInt(args[1] ?? "7", 10) || 7;
            await message.reply(`📊 Generating usage charts (last ${days} days)...`);
            const { embed } = await generateStatsEmbed(days);
            const chartEmbeds = await generateChartEmbeds(days);
            await message.reply({ embeds: [embed] });
            for (const chartEmbed of chartEmbeds) {
                if (message.channel.isSendable()) {
                    await message.channel.send({ embeds: [chartEmbed] });
                }
            }
            return;
        }
        // ── Eval Suite ─────────────────────────────────────────────────
        if (command === "!eval") {
            const categoryFilter = args[1]; // optional: !eval shell, !eval github ...
            await message.reply(`🧪 Running eval regression suite${categoryFilter ? ` (category: ${categoryFilter})` : ""}...`);
            try {
                const report = await runEvalSuite({
                    verbose: false,
                    ...(categoryFilter ? { categories: [categoryFilter] } : {}),
                });
                const reportText = formatDiscordReport(report);
                const chunks = smartSplitMessage(reportText, 1900);
                for (const chunk of chunks) {
                    if (message.channel.isSendable()) {
                        await message.channel.send(chunk);
                    }
                }
                const ciStatus = report.ciShouldFail
                    ? "❌ **FAILED** — below 80% threshold or critical case failed."
                    : "✅ **PASSED** — all thresholds met.";
                await message.reply(`**CI Decision**: ${ciStatus}`);
            }
            catch (err) {
                await message.reply(`❌ Eval runner error: ${err.message}`);
            }
            return;
        }
        // ── Trace Viewer ───────────────────────────────────────────────
        if (command === "!traces") {
            const { tracer } = await import("../tracing/tracer.js");
            const traceFiles = tracer.listTraces(5);
            if (traceFiles.length === 0) {
                await message.reply("📊 No traces yet. Use `!agent` to generate one.");
                return;
            }
            const embed = new EmbedBuilder()
                .setTitle("📊 Recent Agent Traces")
                .setColor(0x5865f2)
                .setDescription(traceFiles.map((f, i) => `${i + 1}. \`${f}\``).join("\n"))
                .addFields({ name: "📁 Location", value: "`traces/` directory — JSON format" })
                .setFooter({ text: "Each trace contains full LLM spans, tool calls, latency, and token usage" });
            await message.reply({ embeds: [embed] });
            return;
        }
    }
    catch (error) {
        await message.reply(`❌ Error: ${error.message}`);
    }
}
// ── Orchestrator Command: !agent <request> ────────────────────────────────
/**
 * Routes to the full multi-agent pipeline:
 *   PlannerAgent → ImplementerAgent → VerifierAgent → Decision
 *
 * Examples:
 *   !agent Fix the failing auth test in src/auth/login.test.ts
 *   !agent Look at issue #12 in owner/repo and implement the fix
 *   !agent Refactor the netlify daemon to use async/await properly
 */
async function handleAgentCommand(message) {
    const request = message.content.replace(/^!agent\s*/i, "").trim();
    if (!request) {
        await message.reply("**Usage**: `!agent <request>`\n\n" +
            "**Examples**:\n" +
            "• `!agent Fix the failing auth test`\n" +
            "• `!agent Look at issue #5 in owner/repo and fix it`\n" +
            "• `!agent Add input validation to the login endpoint`");
        return;
    }
    // Only listen to Direct Messages (DMs) OR explicit mentions in server guilds
    const isDM = !message.guild;
    const isMentioned = client.user ? message.mentions.has(client.user) : false;
    logDebug(`[handleMessage] isDM: ${isDM}, isMentioned: ${isMentioned}`);
    if (!isDM && !isMentioned) {
        logDebug(`[handleMessage] Ignored message (neither DM nor explicit mention).`);
        return; // Ignore other server conversation to save tokens/costs
    }
    const userId = message.author.id;
    if (!permissionManager.canWrite(userId)) {
        await message.reply("❌ You need **write** permission to use the orchestrator. Ask an admin for `!grant @you write`.");
        return;
    }
    if (!message.channel.isSendable())
        return;
    const sendLog = async (text) => {
        const chunks = smartSplitMessage(text, 1900);
        for (const chunk of chunks) {
            if (message.channel.isSendable()) {
                await message.channel.send(chunk);
            }
        }
    };
    const isAdmin = permissionManager.isAdmin(userId);
    const workspaceRoot = isAdmin ? process.cwd() : workspaceManager.ensureWorkspace(userId);
    // Extract GitHub repo and issue references from the request text
    const repoMatch = request.match(/\b([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\b/);
    const issueMatch = request.match(/issue\s+#?(\d+)/i);
    const [defaultOwner, defaultRepoName] = (CONFIG.GITHUB_DEFAULT_REPO ?? "").split("/");
    const agentCtx = {
        channelId: message.channel.id,
        userId,
        workspaceRoot,
        repoOwner: repoMatch?.[1] ?? defaultOwner,
        repoName: repoMatch?.[2] ?? defaultRepoName,
        issueNumber: issueMatch?.[1] ? parseInt(issueMatch[1], 10) : undefined,
        sendLog,
    };
    graphStore.addNode({
        type: "user_action",
        label: "Agent Requested",
        status: "success",
        createdBy: `discord:${message.author.username}`,
        colorCode: "fuchsia",
        details: { description: request }
    });
    try {
        const result = await orchestrator.run(request, agentCtx);
        const totalSecs = (result.totalLatencyMs / 1000).toFixed(1);
        let summaryEmbed;
        switch (result.decision.action) {
            case "auto_commit": {
                const d = result.decision;
                summaryEmbed = new EmbedBuilder()
                    .setTitle("✅ Orchestrator: Auto-Commit Ready")
                    .setColor(0x00c853)
                    .setDescription("All tests passed. PR was submitted for approval and created if approved.")
                    .addFields({ name: "📋 PR Title", value: d.prTitle }, { name: "🔬 Confidence", value: `${((result.verifyResult?.confidence ?? 0) * 100).toFixed(0)}%`, inline: true }, { name: "🧪 Tests", value: `${result.verifyResult?.testResults?.passing ?? "?"}/${result.verifyResult?.testResults?.totalTests ?? "?"} passing`, inline: true }, { name: "⏱ Time", value: `${totalSecs}s`, inline: true })
                    .setFooter({ text: `Task: ${result.taskId} | Trace: ${result.traceId ?? "local"}` });
                break;
            }
            case "request_approval": {
                const d = result.decision;
                summaryEmbed = new EmbedBuilder()
                    .setTitle("🟠 Orchestrator: Review Required")
                    .setColor(0xff8c00)
                    .setDescription("Implementation done but confidence below auto-commit threshold.")
                    .addFields({ name: "📋 Reason", value: d.reason.substring(0, 500) }, { name: "📄 Diff Summary", value: `\`\`\`diff\n${d.diff.substring(0, 600)}\n\`\`\`` }, { name: "⏱ Time", value: `${totalSecs}s`, inline: true })
                    .setFooter({ text: `Task: ${result.taskId} | Trace: ${result.traceId ?? "local"}` });
                break;
            }
            case "escalate": {
                const d = result.decision;
                summaryEmbed = new EmbedBuilder()
                    .setTitle("⚠️ Orchestrator: Escalated")
                    .setColor(0xff3d00)
                    .setDescription("The agent could not complete this task with sufficient confidence.")
                    .addFields({ name: "📋 Reason", value: d.reason.substring(0, 600) }, { name: "⏱ Time", value: `${totalSecs}s`, inline: true })
                    .setFooter({ text: `Task: ${result.taskId} | Trace: ${result.traceId ?? "local"}` });
                break;
            }
            default: {
                const d = result.decision;
                summaryEmbed = new EmbedBuilder()
                    .setTitle("🛑 Orchestrator: Aborted")
                    .setColor(0x808080)
                    .addFields({ name: "📋 Reason", value: d.reason ?? "Unknown" })
                    .setFooter({ text: `Task: ${result.taskId}` });
            }
        }
        if (message.channel.isSendable()) {
            await message.channel.send({ embeds: [summaryEmbed] });
        }
        await recordMessage();
        await recordResponseTime(result.totalLatencyMs);
    }
    catch (err) {
        await recordError();
        await sendLog(`❌ **Orchestrator error**: ${err.message}`);
    }
}
// ── Main Message Handler ───────────────────────────────────────────────────
async function handleMessage(message) {
    if (message.author.bot)
        return;
    if (message.content.startsWith("!")) {
        if (message.content.toLowerCase().startsWith("!agent")) {
            await handleAgentCommand(message);
        }
        else {
            await handleAdminCommand(message);
        }
        return;
    }
    const userId = message.author.id;
    if (!permissionManager.canRead(userId))
        return;
    if (!message.channel.isSendable())
        return;
    graphStore.addNode({
        type: "user_action",
        label: "Discord Chat",
        status: "success",
        createdBy: `discord:${message.author.username}`,
        colorCode: "indigo",
        details: { description: message.cleanContent }
    });
    await message.channel.sendTyping();
    const historyKey = `${message.channel.id}:${userId}`;
    if (!chatHistory.has(historyKey)) {
        const isAdmin = permissionManager.isAdmin(userId);
        const workspacePath = isAdmin ? process.cwd() : workspaceManager.ensureWorkspace(userId);
        chatHistory.set(historyKey, [{
                role: "system",
                content: `You are a DevOps Agent connected to the user's local machine.
SYSTEM INFO:
- OS: ${process.platform}
- User Workspace: ${workspacePath}
${isAdmin ? "- ADMIN ACCESS: Full system access." : "- SANDBOXED: Restricted to workspace directory."}
INSTRUCTIONS:
1. Use tools to answer — never fabricate file contents or command output.
2. For complex multi-step tasks (fix a bug, implement a feature), suggest: \`!agent <request>\`
3. ${isAdmin ? "Do not refuse commands." : "Stay within your workspace."}
`,
            }]);
    }
    const history = chatHistory.get(historyKey);
    history.push({ role: "user", content: message.cleanContent });
    try {
        await recordMessage();
        const startTime = Date.now();
        let aiMessage = await callOpenRouter(history);
        const histEntry = { role: "assistant", content: aiMessage.content, tool_calls: aiMessage.tool_calls };
        if (aiMessage.reasoning_details)
            histEntry.reasoning_details = aiMessage.reasoning_details;
        history.push(histEntry);
        if (aiMessage.tool_calls) {
            for (const toolCall of aiMessage.tool_calls) {
                await message.channel.send(`⚙️ *Running \`${toolCall.function.name}\`...*`);
                let args = {};
                try {
                    args = JSON.parse(toolCall.function.arguments || "{}");
                }
                catch {
                    args = {};
                }
                const sendLog = async (text) => {
                    const chunks = smartSplitMessage(text, 1900);
                    for (const chunk of chunks) {
                        if (message.channel.isSendable())
                            await message.channel.send(chunk);
                    }
                };
                const isAdmin = permissionManager.isAdmin(userId);
                let workspaceRoot = "";
                if (!isAdmin) {
                    const wsId = permissionManager.getWorkspaceId(userId);
                    let userWsPath = "";
                    if (wsId) {
                        const ws = workspaceStore.list().find(w => w.id === wsId);
                        if (ws) {
                            userWsPath = ws.path;
                        }
                    }
                    workspaceRoot = userWsPath || workspaceManager.ensureWorkspace(userId);
                }
                const context = {
                    channelId: message.channel.id,
                    sendLog,
                    userId,
                    ...(isAdmin ? {} : { workspaceRoot: workspaceManager.ensureWorkspace(userId) }),
                };
                const toolResult = await executeToolCall(toolCall.function.name, args, context);
                await recordToolCall(toolCall.function.name);
                history.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
            }
            const finalMsg = await callOpenRouter(history);
            const finalEntry = { role: "assistant", content: finalMsg.content };
            if (finalMsg.reasoning_details)
                finalEntry.reasoning_details = finalMsg.reasoning_details;
            history.push(finalEntry);
            let text = finalMsg.content || "Done.";
            const chunks = smartSplitMessage(text, 2000);
            if (chunks.length === 1 && chunks[0]) {
                await message.reply(chunks[0]);
            }
            else {
                for (const chunk of chunks) {
                    if (message.channel.isSendable())
                        await message.channel.send(chunk);
                }
            }
            await recordResponseTime(Date.now() - startTime);
        }
        else {
            let replyText = aiMessage.content || ".";
            if (aiMessage.reasoning_content) {
                replyText = `||**My Thoughts:**\n${aiMessage.reasoning_content.substring(0, 800)}...||\n\n` + replyText;
            }
            await recordResponseTime(Date.now() - startTime);
            const chunks = smartSplitMessage(replyText, 2000);
            if (chunks.length === 1 && chunks[0]) {
                await message.reply(chunks[0]);
            }
            else {
                for (const chunk of chunks) {
                    if (message.channel.isSendable())
                        await message.channel.send(chunk);
                }
            }
        }
    }
    catch (error) {
        logDebug(`[handleMessage Error] Caught error: ${error.stack || error.message}`);
        console.error("❌ Error:", error);
        await recordError();
        try {
            await message.reply("⚠️ Something went wrong. Check the console for details.");
        }
        catch { }
    }
}
// ── Startup Health Report ─────────────────────────────────────────────────
async function sendStartupHealthReport() {
    try {
        const adminId = CONFIG.ALLOWED_USER_ID;
        if (!adminId)
            return;
        const adminUser = await client.users.fetch(adminId);
        if (!adminUser)
            return;
        const { embed, overallStatus } = await generateHealthReport();
        const dmChannel = await adminUser.createDM();
        await dmChannel.send({ content: "🌅 **Bot startup complete.** Health report:", embeds: [embed] });
        console.log(`✅ Health report sent to admin (Status: ${overallStatus})`);
    }
    catch (error) {
        console.error("❌ Failed to send startup health report:", error);
    }
}
//# sourceMappingURL=client.js.map