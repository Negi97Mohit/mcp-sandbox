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
declare class ChatStore {
    private historyDir;
    constructor();
    private ensureDirectory;
    private getSessionFilePath;
    getHistory(sessionId: string): ChatMessage[];
    appendMessage(sessionId: string, message: Omit<ChatMessage, "timestamp">): ChatMessage[];
    clearHistory(sessionId: string): void;
    listSessions(): ChatSession[];
}
export declare const chatStore: ChatStore;
export {};
//# sourceMappingURL=ChatStore.d.ts.map