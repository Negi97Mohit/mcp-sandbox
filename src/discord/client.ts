import { Client, GatewayIntentBits, Partials, Message } from "discord.js";
import { CONFIG } from "../config/env.js";
import { callOpenRouter } from "../llm/openRouter.js";
import { executeToolCall } from "../tools/index.js";
import { smartSplitMessage } from "./utils.js";
import { permissionManager } from "../core/PermissionManager.js";
import { workspaceManager } from "../core/WorkspaceManager.js";
import type { ToolContext } from "../types/toolContext.js";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

// Store history WITH reasoning details
const chatHistory: Map<string, any[]> = new Map();

client.once("ready", () => {
    console.log(`🤖 Reasoning Bot Online: ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
    await handleMessage(message);
});

async function handleAdminCommand(message: Message) {
    const args = message.content.trim().split(/\s+/);
    const command = args[0].toLowerCase();
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
    } catch (error: any) {
        await message.reply(`❌ Error: ${error.message}`);
    }
}

async function handleMessage(message: Message) {
    if (message.author.bot) return;

    // 0. Handle Admin Commands
    if (message.content.startsWith("!")) {
        await handleAdminCommand(message);
        return;
    }

    const userId = message.author.id;

    // 1. Permission Check
    if (!permissionManager.canRead(userId)) {
        // Optional: Reply once or maintain silence. Silence is safer/cleaner.
        // If they DM the bot, maybe reply? For now, silence.
        return;
    }

    // Type guard for text-based channels
    if (!message.channel.isSendable()) return;
    await message.channel.sendTyping();

    if (!chatHistory.has(message.channel.id)) {
        // Build dynamic system context
        const homeDir = process.env.USERPROFILE || process.env.HOME || "unknown";
        const osType = process.platform;
        const cwd = process.cwd();

        // Determine prompt based on User Role causes cache fragmentation but is safer
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

        chatHistory.set(message.channel.id, [
            {
                role: "system",
                content: systemPrompt,
            },
        ]);
    }
    const history = chatHistory.get(message.channel.id)!;
    history.push({ role: "user", content: message.content });

    try {
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
                await message.channel.send(
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
                        if (message.channel.isSendable()) {
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
                    workspaceRoot: isAdmin ? undefined : workspaceManager.ensureWorkspace(userId)
                };

                const toolResult = await executeToolCall(toolCall.function.name, args, context);

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
                    if (message.channel.isSendable()) {
                        await (message.channel as any).send(chunk);
                    }
                }
            }
        } else {
            // No tools, just reply
            let replyText = aiMessage.content || ".";

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
                    if (message.channel.isSendable()) {
                        await (message.channel as any).send(chunk);
                    }
                }
            }
        }
    } catch (error) {
        console.error("❌ Error:", error);
        try {
            await message.reply("⚠️ Something went wrong. Check the console for details.");
        } catch {
            console.error("Could not send error message to Discord");
        }
    }
}
