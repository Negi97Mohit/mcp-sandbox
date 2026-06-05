export interface ToolContext {
    channelId: string;
    sendLog: (text: string) => Promise<void>;
    userId?: string;
    workspaceRoot?: string;
}
//# sourceMappingURL=toolContext.d.ts.map