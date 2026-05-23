import { ipcMain, BrowserWindow } from "electron";
import { callOpenRouter } from "../../src/llm/openRouter.js";
import { executeToolCall } from "../../src/tools/index.js";
import { chatStore } from "../../src/core/ChatStore.js";
import { actionLogger } from "../../src/core/ActionLogger.js";
import { recordMessage, recordToolCall, recordResponseTime, recordError } from "../../src/health/statsTracker.js";
import { CONFIG } from "../../src/config/env.js";

export function registerChatHandlers() {
    ipcMain.handle("chat:history", (_event, sessionId: string) => {
        return chatStore.getHistory(sessionId);
    });

    ipcMain.handle("chat:clear", (_event, sessionId: string) => {
        chatStore.clearHistory(sessionId);
        return { success: true };
    });

    ipcMain.handle("chat:sessions", () => {
        return chatStore.listSessions();
    });

    ipcMain.handle("chat:send", async (event, sessionId: string, message: string) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        const sendUpdate = (data: any) => {
            if (win) {
                win.webContents.send("chat:stream", { sessionId, ...data });
            }
        };

        // Save user message to store
        chatStore.appendMessage(sessionId, {
            id: `msg_${Date.now()}_u`,
            role: "user",
            content: message,
        });

        sendUpdate({ type: "status", status: "thinking" });

        try {
            await recordMessage();
            const startTime = Date.now();

            // Load full history
            const rawHistory = chatStore.getHistory(sessionId);
            
            // Map our saved format to OpenRouter format
            const messagesForAI = rawHistory.map(m => ({
                role: m.role,
                content: m.content,
                tool_calls: m.tool_calls,
                tool_call_id: m.tool_call_id,
            }));

            // Ensure system prompt is present
            if (!messagesForAI.some(m => m.role === "system")) {
                const systemPrompt = `You are a DevOps Agent connected to the user's local machine.
SYSTEM INFO:
- OS: ${process.platform}
- User Workspace: ${process.cwd()}
- **ADMIN ACCESS**: You have full system access.

CRITICAL INSTRUCTIONS:
1. **PERMISSIONS**: You are running as ADMIN.
2. **TOOLS**: Use 'write_file' and 'run_shell' to execute tasks.
`;
                messagesForAI.unshift({ role: "system", content: systemPrompt, tool_calls: undefined, tool_call_id: undefined });
            }

            // 1st Call to AI
            const aiMessage = await callOpenRouter(messagesForAI);
            
            // Store AI message
            chatStore.appendMessage(sessionId, {
                id: `msg_${Date.now()}_a`,
                role: "assistant",
                content: aiMessage.content || "",
                tool_calls: aiMessage.tool_calls,
            });

            if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
                // Execute tools
                for (const toolCall of aiMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    let args = {};
                    try {
                        args = JSON.parse(toolCall.function.arguments || "{}");
                    } catch (e) {
                        console.error("Failed to parse tool arguments:", toolCall.function.arguments);
                    }

                    sendUpdate({
                        type: "tool_start",
                        toolName,
                        arguments: args,
                    });

                    await recordToolCall(toolName);
                    const toolStartTime = Date.now();

                    const sendLog = async (text: string) => {
                        sendUpdate({ type: "tool_log", text });
                    };

                    const context = {
                        channelId: sessionId,
                        sendLog,
                        userId: "desktop-admin",
                    };

                    let result;
                    let status: "success" | "error" = "success";
                    let errorStr: string | undefined;

                    try {
                        result = await executeToolCall(toolName, args, context);
                    } catch (err: any) {
                        status = "error";
                        errorStr = err.message || String(err);
                        result = { error: errorStr };
                    }

                    // Save action log
                    await actionLogger.log({
                        platform: "desktop-ui",
                        userId: "desktop-admin",
                        toolName,
                        arguments: args,
                        result,
                        durationMs: Date.now() - toolStartTime,
                        status,
                        error: errorStr,
                    });

                    // Append tool response to ChatStore
                    chatStore.appendMessage(sessionId, {
                        id: `msg_${Date.now()}_t`,
                        role: "tool",
                        content: typeof result === "object" ? JSON.stringify(result) : String(result),
                        tool_call_id: toolCall.id,
                    });

                    sendUpdate({
                        type: "tool_end",
                        toolName,
                        result,
                    });
                }

                // Call with tool results
                sendUpdate({ type: "status", status: "thinking" });
                const updatedHistory = chatStore.getHistory(sessionId).map(m => ({
                    role: m.role,
                    content: m.content,
                    tool_calls: m.tool_calls,
                    tool_call_id: m.tool_call_id,
                }));
                
                if (!updatedHistory.some(m => m.role === "system")) {
                    const systemPrompt = `You are a DevOps Agent connected to the user's local machine.
SYSTEM INFO:
- OS: ${process.platform}
- User Workspace: ${process.cwd()}
- **ADMIN ACCESS**: You have full system access.
`;
                    updatedHistory.unshift({ role: "system", content: systemPrompt, tool_calls: undefined, tool_call_id: undefined });
                }

                const finalAiMessage = await callOpenRouter(updatedHistory);
                
                chatStore.appendMessage(sessionId, {
                    id: `msg_${Date.now()}_f`,
                    role: "assistant",
                    content: finalAiMessage.content || "",
                });

                await recordResponseTime(Date.now() - startTime);

                sendUpdate({
                    type: "complete",
                    content: finalAiMessage.content || "",
                });

            } else {
                await recordResponseTime(Date.now() - startTime);
                sendUpdate({
                    type: "complete",
                    content: aiMessage.content || "",
                });
            }

        } catch (err: any) {
            console.error("Error in chat handlers:", err);
            await recordError();
            sendUpdate({
                type: "error",
                error: err.message || String(err),
            });
        }

        return { success: true };
    });
}
