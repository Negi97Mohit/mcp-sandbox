import fs from "fs";
import path from "path";
class ChatStore {
    historyDir = path.join(process.cwd(), "chat_history");
    constructor() {
        this.ensureDirectory();
    }
    ensureDirectory() {
        if (!fs.existsSync(this.historyDir)) {
            fs.mkdirSync(this.historyDir, { recursive: true });
        }
    }
    getSessionFilePath(sessionId) {
        // Sanitize sessionId to avoid path traversal
        const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
        return path.join(this.historyDir, `${safeId}.json`);
    }
    getHistory(sessionId) {
        this.ensureDirectory();
        const filePath = this.getSessionFilePath(sessionId);
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, "utf-8"));
            }
        }
        catch (err) {
            console.error(`Failed to read chat history for session ${sessionId}:`, err);
        }
        return [];
    }
    appendMessage(sessionId, message) {
        this.ensureDirectory();
        const filePath = this.getSessionFilePath(sessionId);
        const history = this.getHistory(sessionId);
        const fullMessage = {
            timestamp: new Date().toISOString(),
            ...message,
        };
        history.push(fullMessage);
        try {
            fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8");
        }
        catch (err) {
            console.error(`Failed to save chat history for session ${sessionId}:`, err);
        }
        return history;
    }
    clearHistory(sessionId) {
        this.ensureDirectory();
        const filePath = this.getSessionFilePath(sessionId);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (err) {
            console.error(`Failed to clear chat history for session ${sessionId}:`, err);
        }
    }
    listSessions() {
        this.ensureDirectory();
        const sessions = [];
        try {
            const files = fs.readdirSync(this.historyDir)
                .filter(f => f.endsWith(".json"));
            for (const file of files) {
                const sessionId = path.basename(file, ".json");
                const filePath = path.join(this.historyDir, file);
                const stat = fs.statSync(filePath);
                const history = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                const lastMsg = history[history.length - 1];
                sessions.push({
                    id: sessionId,
                    createdTime: history[0]?.timestamp || stat.birthtime.toISOString(),
                    lastActiveTime: lastMsg?.timestamp || stat.mtime.toISOString(),
                    messageCount: history.length,
                    lastMessage: lastMsg?.content || (lastMsg?.tool_calls ? "Running tools..." : ""),
                });
            }
        }
        catch (err) {
            console.error("Failed to list chat sessions:", err);
        }
        // Sort by last active time descending
        return sessions.sort((a, b) => b.lastActiveTime.localeCompare(a.lastActiveTime));
    }
}
export const chatStore = new ChatStore();
//# sourceMappingURL=ChatStore.js.map