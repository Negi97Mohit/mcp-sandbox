export interface ActionLogEntry {
    id: string;
    timestamp: string;
    platform: string;
    userId: string;
    toolName: string;
    arguments: Record<string, any>;
    result: any;
    durationMs: number;
    status: 'success' | 'error';
    error?: string | undefined;
}
declare class ActionLogger {
    private logsDir;
    constructor();
    private ensureDirectory;
    private getLogFilePath;
    log(entry: Omit<ActionLogEntry, "id" | "timestamp">): Promise<ActionLogEntry>;
    getRecent(count?: number, filters?: {
        toolName?: string;
        userId?: string;
        platform?: string;
    }): Promise<ActionLogEntry[]>;
    getById(id: string): Promise<ActionLogEntry | undefined>;
}
export declare const actionLogger: ActionLogger;
export {};
//# sourceMappingURL=ActionLogger.d.ts.map