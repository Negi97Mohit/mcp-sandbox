export interface ToolContext {
    channelId: string;
    sendLog: (text: string) => Promise<void>;
}
