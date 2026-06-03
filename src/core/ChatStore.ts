import fs from "fs";
import path from "path";

export interface ChatMessage {
    id: string;
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    timestamp: string;
    tool_call_id?: string;
    tool_calls?: any[];
    reasoning_content?: string;
    reasoning_details?: any;
}

export interface ChatSession {
    id: string;
    createdTime: string;
    lastActiveTime: string;
    messageCount: number;
    lastMessage?: string;
}

class ChatStore {
    private historyDir = path.join(process.cwd(), "chat_history");

    constructor() {
        this.ensureDirectory();
    }

    private ensureDirectory() {
        if (!fs.existsSync(this.historyDir)) {
            fs.mkdirSync(this.historyDir, { recursive: true });
        }
    }

    private getSessionFilePath(sessionId: string): string {
        // Sanitize sessionId to avoid path traversal
        const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
        return path.join(this.historyDir, `${safeId}.json`);
    }

    getHistory(sessionId: string): ChatMessage[] {
        this.ensureDirectory();
        const filePath = this.getSessionFilePath(sessionId);
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, "utf-8"));
            }
        } catch (err) {
            console.error(`Failed to read chat history for session ${sessionId}:`, err);
        }
        return [];
    }

    appendMessage(sessionId: string, message: Omit<ChatMessage, "timestamp">): ChatMessage[] {
        this.ensureDirectory();
        const filePath = this.getSessionFilePath(sessionId);
        const history = this.getHistory(sessionId);

        const fullMessage: ChatMessage = {
            timestamp: new Date().toISOString(),
            ...message,
        };

        history.push(fullMessage);

        try {
            fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8");
        } catch (err) {
            console.error(`Failed to save chat history for session ${sessionId}:`, err);
        }

        return history;
    }

    clearHistory(sessionId: string): void {
        this.ensureDirectory();
        const filePath = this.getSessionFilePath(sessionId);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error(`Failed to clear chat history for session ${sessionId}:`, err);
        }
    }

    listSessions(): ChatSession[] {
        this.ensureDirectory();
        const sessions: ChatSession[] = [];
        try {
            const files = fs.readdirSync(this.historyDir)
                .filter(f => f.endsWith(".json"));

            for (const file of files) {
                const sessionId = path.basename(file, ".json");
                const filePath = path.join(this.historyDir, file);
                const stat = fs.statSync(filePath);
                const history = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ChatMessage[];
                
                const lastMsg = history[history.length - 1];

                sessions.push({
                    id: sessionId,
                    createdTime: history[0]?.timestamp || stat.birthtime.toISOString(),
                    lastActiveTime: lastMsg?.timestamp || stat.mtime.toISOString(),
                    messageCount: history.length,
                    lastMessage: lastMsg?.content || (lastMsg?.tool_calls ? "Running tools..." : ""),
                });
            }
        } catch (err) {
            console.error("Failed to list chat sessions:", err);
        }

        // Sort by last active time descending
        return sessions.sort((a, b) => b.lastActiveTime.localeCompare(a.lastActiveTime));
    }
}

export const chatStore = new ChatStore();
