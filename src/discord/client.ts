import { Client, GatewayIntentBits, Partials, Message, TextChannel } from "discord.js";
import { CONFIG } from "../config/env.js";
import { callOpenRouter, type RateLimitError } from "../llm/openRouter.js";
import { executeToolCall } from "../tools/index.js";
import { smartSplitMessage } from "./utils.js";
import { permissionManager } from "../core/PermissionManager.js";
import { workspaceManager } from "../core/WorkspaceManager.js";
import type { ToolContext } from "../types/toolContext.js";
import { generateHealthReport, generateHistoryEmbed } from "../health/healthCheck.js";
import { recordMessage, recordToolCall, recordError, recordResponseTime } from "../health/statsTracker.js";
import { generateChartEmbeds, generateStatsEmbed } from "../health/chartGenerator.js";
import * as fs from "fs";
import * as path from "path";

// Initialize a debug log file in process.cwd()
const debugLogPath = path.join(process.cwd(), "discord_debug.log");
try {
    fs.writeFileSync(debugLogPath, `=== DISCORD AGENT DEBUG SESSION STARTED ${new Date().toISOString()} ===\n`, "utf-8");
} catch (e) {
    console.error("Failed to initialize discord_debug.log:", e);
}

export function logDebug(message: string) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message}\n`;
    console.log(formatted.trim());
    try {
        fs.appendFileSync(debugLogPath, formatted, "utf-8");
    } catch (e) {
        console.error("Failed to write to discord_debug.log:", e);
    }
}

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
});

// Store history WITH reasoning details
const chatHistory: Map<string, any[]> = new Map();

client.once("ready", async () => {
    logDebug(`🤖 Reasoning Bot Online: ${client.user?.tag}`);

    // Send startup health report to admin
    await sendStartupHealthReport();
});

/**
 * Send health report to admin on bot startup
 */
async function sendStartupHealthReport() {
    try {
        // Get admin user ID
        const adminId = CONFIG.ALLOWED_USER_ID;
        if (!adminId) {
            logDebug("⚠️ No ALLOWED_USER_ID set, skipping startup health report");
            return;
        }

        // Try to DM the admin
        const adminUser = await client.users.fetch(adminId);
        if (!adminUser) {
            logDebug("⚠️ Could not find admin user for health report");
            return;
        }

        logDebug("📊 Generating startup health report...");
        const { embed, overallStatus } = await generateHealthReport();

        const dmChannel = await adminUser.createDM();
        await dmChannel.send({
            content: `🌅 **Good morning!** Here's your daily bot health report:`,
            embeds: [embed]
        });

        logDebug(`✅ Health report sent to admin (Status: ${overallStatus})`);

    } catch (error) {
        console.error("❌ Failed to send startup health report:", error);
        logDebug(`❌ Failed to send startup health report: ${error}`);
    }
}

client.on("messageCreate", async (message) => {
    logDebug(`[messageCreate Event] Fired! Author: ${message.author.tag} (${message.author.id}), Bot: ${message.author.bot}`);
    try {
        await handleMessage(message);
    } catch (e: any) {
        logDebug(`[messageCreate Event Error] Fatal error in event handler: ${e.message}`);
    }
});

async function handleAdminCommand(message: Message) {
    const args = message.content.trim().split(/\s+/);
    const command = (args[0] || "").toLowerCase();
    const adminId = message.author.id;

    if (!permissionManager.isAdmin(adminId)) {
        await message.reply("❌ You do not have permission to run admin commands.");
        return;
    }

    try {
        if (command === "!grant") {
            const targetUser = message.mentions.users.first();
            const role = args[2] as any;
            if (!targetUser || !['read', 'write', 'admin'].includes(role)) {
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
            const lines = allUsers.map(u => `• <@${u.userId}>: **${u.role}**`).join('\n');
            await message.reply(`📋 **User Permissions:**\n${lines}`);
            return;
        }

        if (command === "!workspace") {
            if (args[1] === "create") {
                const targetUser = message.mentions.users.first();
                if (!targetUser) {
                    await message.reply("Usage: `!workspace create @user`");
                    return;
                }
                const path = workspaceManager.ensureWorkspace(targetUser.id);
                await message.reply(`📂 Workspace created at: \`${path}\``);
                return;
            }
        }

        if (command === "!health") {
            await message.reply("🔍 Running health checks...");
            try {
                const { embed, overallStatus } = await generateHealthReport();
                await message.reply({ embeds: [embed] });
            } catch (error: any) {
                await message.reply(`❌ Health check failed: ${error.message}`);
            }
            return;
        }

        if (command === "!history") {
            const days = parseInt(args[1] ?? "7", 10) || 7;
            await message.reply(`📊 Fetching health report history (last ${days} days)...`);
            try {
                const embed = await generateHistoryEmbed(days);
                await message.reply({ embeds: [embed] });
            } catch (error: any) {
                await message.reply(`❌ Failed to get history: ${error.message}`);
            }
            return;
        }

        if (command === "!stats") {
            const days = parseInt(args[1] ?? "7", 10) || 7;
            await message.reply(`📊 Generating usage charts (last ${days} days)...`);
            try {
                const { embed } = await generateStatsEmbed(days);
                const chartEmbeds = await generateChartEmbeds(days);

                // Send summary first
                await message.reply({ embeds: [embed] });

                // Send chart embeds (max 10 per message)
                for (const chartEmbed of chartEmbeds) {
                    if (typeof (message.channel as any).send === 'function') {
                        await (message.channel as any).send({ embeds: [chartEmbed] });
                    }
                }
            } catch (error: any) {
                await message.reply(`❌ Failed to generate stats: ${error.message}`);
            }
            return;
        }
    } catch (error: any) {
        await message.reply(`❌ Error: ${error.message}`);
    }
}

async function handleMessage(message: Message) {
    if (message.author.bot) {
        logDebug(`[handleMessage] Ignored bot message from ${message.author.tag}`);
        return;
    }

    logDebug(`[handleMessage] Received message from ${message.author.tag} (${message.author.id})`);
    logDebug(`[handleMessage] Raw Message Content: "${message.content}"`);
    logDebug(`[handleMessage] Guild: ${message.guild ? `${message.guild.name} (${message.guild.id})` : "Direct Message (DM)"}`);
    logDebug(`[handleMessage] Channel Type: ${message.channel.type}`);

    // Log the mentions details
    if (message.mentions.users.size > 0) {
        logDebug(`[handleMessage] Mentions User IDs: ${Array.from(message.mentions.users.keys()).join(", ")}`);
        logDebug(`[handleMessage] Mentions User Tags: ${message.mentions.users.map(u => u.tag).join(", ")}`);
    } else {
        logDebug(`[handleMessage] Mentions: None`);
    }
    
    if (client.user) {
        logDebug(`[handleMessage] Bot User ID is: ${client.user.id}, Username: ${client.user.tag}`);
    } else {
        logDebug(`[handleMessage] Bot User is not initialized yet!`);
    }

    // 0. Handle Admin Commands
    if (message.content.startsWith("!")) {
        logDebug(`[handleMessage] Running admin command: ${message.content}`);
        await handleAdminCommand(message);
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
    const canRead = permissionManager.canRead(userId);
    const role = permissionManager.getRole(userId);
    logDebug(`[handleMessage] userId: ${userId}, canRead: ${canRead}, role: ${role}`);

    // 1. Permission Check
    if (!canRead) {
        logDebug(`[handleMessage] Access Denied for ${message.author.tag} (${userId})`);
        try {
            await message.reply(
                `🚫 **Access Denied**: You do not have permission to interact with this DevOps Agent.\n` +
                `Please ask an Administrator to grant you access using: \`!grant <@${userId}> <read|write|admin>\``
            );
            logDebug(`[handleMessage] Replied Access Denied successfully.`);
        } catch (e: any) {
            logDebug(`[handleMessage] Failed to send permission warning: ${e.message}`);
        }
        return;
    }

    // Type guard for text-based channels
    if (typeof (message.channel as any).send !== 'function') {
        logDebug(`[handleMessage] Channel send method is missing!`);
        return;
    }
    
    logDebug(`[handleMessage] Triggering sendTyping...`);
    try {
        await (message.channel as any).sendTyping();
    } catch (e: any) {
        logDebug(`[handleMessage] sendTyping warning: ${e.message}`);
    }

    // Clean up content: strip the bot mention tag so the AI doesn't get confused by tags
    let cleanContent = message.content;
    if (client.user) {
        const mentionRegex = new RegExp(`<@!?${client.user.id}>`, 'g');
        cleanContent = cleanContent.replace(mentionRegex, '').trim();
    }
    logDebug(`[handleMessage] Clean Content: "${cleanContent}"`);

    // Use composite key: channel + user for isolated prompts per user
    const historyKey = `${message.channel.id}:${userId}`;

    if (!chatHistory.has(historyKey)) {
        // Build dynamic system context
        const osType = process.platform;
        const cwd = process.cwd();

        // Determine prompt based on User Role
        const isAdmin = permissionManager.isAdmin(userId);
        const workspacePath = isAdmin ? cwd : workspaceManager.ensureWorkspace(userId);

        const systemPrompt = `You are a DevOps Agent connected to the user's local machine.
SYSTEM INFO:
- OS: ${osType}
- User Workspace: ${workspacePath}
${isAdmin ? "- **ADMIN ACCESS**: You have full system access." : "- **SANDBOXED**: You are restricted to your workspace directory."}

CRITICAL INSTRUCTIONS:
1. **PERMISSIONS**: ${isAdmin ? "You are running as ADMIN." : "You are a RESTRICTED user. You can only write/read files within your workspace."}
2. **TOOLS**: Use 'write_file' and 'run_shell' to execute tasks.
3. ${isAdmin ? "Do not refuse commands." : "If you try to access files outside your workspace, the tool will fail. Explain this to the user."}
`;

        chatHistory.set(historyKey, [
            {
                role: "system",
                content: systemPrompt,
            },
        ]);
    }
    const history = chatHistory.get(historyKey)!;
    history.push({ role: "user", content: cleanContent });

    try {
        // Record message for stats
        await recordMessage();
        const startTime = Date.now();

        // 1. Initial Call (Using raw fetch to capture reasoning)
        let aiMessage = await callOpenRouter(history);

        // 💡 CRITICAL: Preserve the reasoning_details for the next turn
        const historyEntry: any = {
            role: "assistant",
            content: aiMessage.content,
            tool_calls: aiMessage.tool_calls,
        };

        if (aiMessage.reasoning_details) {
            historyEntry.reasoning_details = aiMessage.reasoning_details;
        }

        history.push(historyEntry);

        // 2. Handle Tools
        if (aiMessage.tool_calls) {
            for (const toolCall of aiMessage.tool_calls) {
                await (message.channel as any).send(
                    `⚙️ *Thinking... then running ${toolCall.function.name}*`,
                );

                let args: any = {};
                try {
                    args = JSON.parse(toolCall.function.arguments || "{}");
                } catch (parseError) {
                    console.error("❌ Failed to parse tool arguments:", toolCall.function.arguments);
                    args = {}; // fallback to empty args
                }

                const sendLog = async (text: string) => {
                    const chunks = smartSplitMessage(text, 1900);
                    for (const chunk of chunks) {
                        if (typeof (message.channel as any).send === 'function') {
                            await (message.channel as any).send(chunk);
                        }
                    }
                };

                // PREPARE CONTEXT WITH PERMISSIONS
                const isAdmin = permissionManager.isAdmin(userId);
                const context: ToolContext = {
                    channelId: message.channel.id,
                    sendLog,
                    userId,
                    ...(isAdmin ? {} : { workspaceRoot: workspaceManager.ensureWorkspace(userId) })
                };

                const toolResult = await executeToolCall(toolCall.function.name, args, context);

                // Record tool call for stats
                await recordToolCall(toolCall.function.name);

                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult),
                });
            }

            // 3. Final Answer (Recursive call with updated history)
            const finalAiMessage = await callOpenRouter(history);

            // Preserve reasoning again
            const finalEntry: any = {
                role: "assistant",
                content: finalAiMessage.content,
            };
            if (finalAiMessage.reasoning_details)
                finalEntry.reasoning_details = finalAiMessage.reasoning_details;
            history.push(finalEntry);

            // Output to Discord
            let text = finalAiMessage.content;
            if (!text && finalAiMessage.reasoning_content) {
                text = `**My Thoughts:**\n${finalAiMessage.reasoning_content}`;
            }
            text = text || "Done (No content returned by AI).";

            const chunks = smartSplitMessage(text, 2000);
            if (chunks.length === 1 && chunks[0] !== undefined) {
                await message.reply(chunks[0]);
            } else {
                for (const chunk of chunks) {
                    if (typeof (message.channel as any).send === 'function') {
                        await (message.channel as any).send(chunk);
                    }
                }
            }

            // Record response time
            await recordResponseTime(Date.now() - startTime);
        } else {
            // No tools, just reply
            let replyText = aiMessage.content || ".";

            // Record response time for non-tool responses
            await recordResponseTime(Date.now() - startTime);

            if (aiMessage.reasoning_content) {
                const thoughts = `||**My Thoughts:**\n${aiMessage.reasoning_content.substring(0, 800)}...||\n\n`;
                replyText = thoughts + replyText;
            }

            // Chunk long messages
            const chunks = smartSplitMessage(replyText, 2000);
            if (chunks.length === 1 && chunks[0] !== undefined) {
                await message.reply(chunks[0]);
            } else {
                for (const chunk of chunks) {
                    if (typeof (message.channel as any).send === 'function') {
                        await (message.channel as any).send(chunk);
                    }
                }
            }
        }
    } catch (error: any) {
        logDebug(`[handleMessage Error] Caught error: ${error.stack || error.message}`);
        console.error("❌ Error:", error);
        await recordError();

        try {
            // ─── Rate-limit: all free models exhausted ───────────────────────
            if (error.isRateLimit && error.allModelsExhausted) {
                let resetMsg = "";
                if (error.resetAt) {
                    const resetDate: Date = error.resetAt;
                    const nowMs = Date.now();
                    const diffMs = resetDate.getTime() - nowMs;
                    if (diffMs > 0) {
                        const hours = Math.floor(diffMs / 3_600_000);
                        const mins  = Math.floor((diffMs % 3_600_000) / 60_000);
                        resetMsg = `\n⏰ **Resets in:** ${hours}h ${mins}m (at <t:${Math.floor(resetDate.getTime() / 1000)}:T>)`;
                    }
                }
                await message.reply(
                    `🚫 **Daily Rate Limit Reached**\n` +
                    `All free AI models have hit their daily request limit.${resetMsg}\n\n` +
                    `**Options:**\n` +
                    `• Wait for the limit to reset (usually midnight UTC)\n` +
                    `• Add credits at <https://openrouter.ai> to unlock more requests\n` +
                    `• Change \`MODEL_NAME\` in your \`.env\` to a paid model`
                );
                logDebug(`[handleMessage Error] Rate limit message sent to Discord.`);
                return;
            }

            // ─── Generic 429 from a single model ─────────────────────────────
            if (error.statusCode === 429 || (error.message?.includes("429") && error.message?.includes("Rate limit"))) {
                await message.reply(
                    `⚠️ **Rate Limited** — The AI model is temporarily unavailable.\n` +
                    `Trying fallback models automatically. Please resend your message in a moment.`
                );
                logDebug(`[handleMessage Error] Single-model rate limit message sent.`);
                return;
            }

            // ─── Generic fallback error ───────────────────────────────────────
            await message.reply(
                `⚠️ **Something went wrong.**\n\`\`\`${error.message?.substring(0, 300) ?? "Unknown error"}\`\`\``
            );
        } catch (replyErr: any) {
            logDebug(`[handleMessage Error] Could not send error message to Discord: ${replyErr.message}`);
        }
    }
}
