"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = registerChatHandlers;
const electron_1 = require("electron");
const openRouter_js_1 = require("../../src/llm/openRouter.js");
const index_js_1 = require("../../src/tools/index.js");
const ChatStore_js_1 = require("../../src/core/ChatStore.js");
const ActionLogger_js_1 = require("../../src/core/ActionLogger.js");
const statsTracker_js_1 = require("../../src/health/statsTracker.js");
const env_js_1 = require("../../src/config/env.js");
function registerChatHandlers() {
    electron_1.ipcMain.handle("chat:history", (_event, sessionId) => {
        return ChatStore_js_1.chatStore.getHistory(sessionId);
    });
    electron_1.ipcMain.handle("chat:clear", (_event, sessionId) => {
        ChatStore_js_1.chatStore.clearHistory(sessionId);
        return { success: true };
    });
    electron_1.ipcMain.handle("chat:sessions", () => {
        return ChatStore_js_1.chatStore.listSessions();
    });
    electron_1.ipcMain.handle("chat:send", async (event, sessionId, message) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        const sendUpdate = (data) => {
            if (win) {
                win.webContents.send("chat:stream", { sessionId, ...data });
            }
        };
        // Save user message to store
        ChatStore_js_1.chatStore.appendMessage(sessionId, {
            id: `msg_${Date.now()}_u`,
            role: "user",
            content: message,
        });
        sendUpdate({ type: "status", status: "thinking" });
        try {
            await (0, statsTracker_js_1.recordMessage)();
            const startTime = Date.now();
            // Load full history
            const rawHistory = ChatStore_js_1.chatStore.getHistory(sessionId);
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
            const aiMessage = await (0, openRouter_js_1.callOpenRouter)(messagesForAI);
            // Store AI message
            ChatStore_js_1.chatStore.appendMessage(sessionId, {
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
                    }
                    catch (e) {
                        console.error("Failed to parse tool arguments:", toolCall.function.arguments);
                    }
                    sendUpdate({
                        type: "tool_start",
                        toolName,
                        arguments: args,
                    });
                    await (0, statsTracker_js_1.recordToolCall)(toolName);
                    const toolStartTime = Date.now();
                    const sendLog = async (text) => {
                        sendUpdate({ type: "tool_log", text });
                    };
                    const context = {
                        channelId: sessionId,
                        sendLog,
                        userId: "desktop-admin",
                    };
                    let result;
                    let status = "success";
                    let errorStr;
                    try {
                        result = await (0, index_js_1.executeToolCall)(toolName, args, context);
                    }
                    catch (err) {
                        status = "error";
                        errorStr = err.message || String(err);
                        result = { error: errorStr };
                    }
                    // Save action log
                    await ActionLogger_js_1.actionLogger.log({
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
                    ChatStore_js_1.chatStore.appendMessage(sessionId, {
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
                const updatedHistory = ChatStore_js_1.chatStore.getHistory(sessionId).map(m => ({
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
                const finalAiMessage = await (0, openRouter_js_1.callOpenRouter)(updatedHistory);
                ChatStore_js_1.chatStore.appendMessage(sessionId, {
                    id: `msg_${Date.now()}_f`,
                    role: "assistant",
                    content: finalAiMessage.content || "",
                });
                await (0, statsTracker_js_1.recordResponseTime)(Date.now() - startTime);
                sendUpdate({
                    type: "complete",
                    content: finalAiMessage.content || "",
                });
            }
            else {
                await (0, statsTracker_js_1.recordResponseTime)(Date.now() - startTime);
                sendUpdate({
                    type: "complete",
                    content: aiMessage.content || "",
                });
            }
        }
        catch (err) {
            console.error("Error in chat handlers:", err);
            await (0, statsTracker_js_1.recordError)();
            sendUpdate({
                type: "error",
                error: err.message || String(err),
            });
        }
        return { success: true };
    });
}
//# sourceMappingURL=chatHandlers.js.map