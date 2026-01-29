import { Client, GatewayIntentBits, Partials, Message, type TextBasedChannel } from "discord.js";
import { CONFIG } from "../config/env.js";
import { callOpenRouter } from "../llm/openRouter.js";
import { executeToolCall } from "../tools/index.js";
import { smartSplitMessage } from "./utils.js";

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

async function handleMessage(message: Message) {
    if (message.author.bot) return;
    if (CONFIG.ALLOWED_USER_ID && message.author.id !== CONFIG.ALLOWED_USER_ID) return;

    // Type guard for text-based channels
    if (!message.channel.isSendable()) return;
    await message.channel.sendTyping();

    if (!chatHistory.has(message.channel.id)) {
        // Build dynamic system context
        const homeDir = process.env.USERPROFILE || process.env.HOME || "unknown";
        const osType = process.platform; // 'win32', 'darwin', 'linux'
        const cwd = process.cwd();

        const systemPrompt = `You are a DevOps Agent connected to the user's local machine. You have FULL SYSTEM ACCESS.
SYSTEM INFO:
- Operating System: ${osType === 'win32' ? 'Windows' : osType === 'darwin' ? 'macOS' : 'Linux'}
- User Home Directory: ${homeDir}
- Current Working Directory: ${cwd}
- Path Separator: ${osType === 'win32' ? '\\\\' : '/'}

CRITICAL - IDENTITY & PERMISSIONS:
1. **SHARED ENVIRONMENT**: You run in the SAME shell process as the user. If the user has 'gcloud', 'npm', or 'git' configured, YOU HAVE IT TOO. You inherit their authenticated session.
2. **NEVER REFUSE COMMANDS**: Do not assume you lack permissions or auth. Always TRY the command. Only report failure if the *tool execution* returns an error.
3. **PROACTIVE EXECUTION**: 
   - If the user asks to "create a file" or "write code", use \`write_file\` IMMEDIATELY. Do not show the code block and ask to save it. Just save it.
   - If the user asks to "list", "run", or "check", use \`run_shell\` IMMEDIATELY.

FILE SYSTEM SAFETY:
- Windows Root (C:\\) is often protected. If the user asks to create files in the root, silently prefer the Desktop or Current Working Directory instead, or explain the permission error *after* trying.

FAILSAFE: 
- Only provide manual instructions if the tool execution FAILS or if the tool is strictly impossible (e.g., physical hardware access).`;

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
                            await (message.channel as TextBasedChannel).send(chunk);
                        }
                    }
                };

                const toolResult = await executeToolCall(toolCall.function.name, args, {
                    channelId: message.channel.id,
                    sendLog
                });

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
                        await (message.channel as TextBasedChannel).send(chunk);
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
                        await (message.channel as TextBasedChannel).send(chunk);
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
