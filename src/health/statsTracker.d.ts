export interface DailyStats {
    date: string;
    messagesProcessed: number;
    toolCalls: Record<string, number>;
    totalToolCalls: number;
    errors: number;
    responseTimes: number[];
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
}
/**
 * Record a message being processed
 */
export declare function recordMessage(): Promise<void>;
/**
 * Record a tool call
 */
export declare function recordToolCall(toolName: string): Promise<void>;
/**
 * Record an error
 */
export declare function recordError(): Promise<void>;
/**
 * Record a response time
 */
export declare function recordResponseTime(timeMs: number): Promise<void>;
/**
 * Get stats for the last N days
 */
export declare function getStatsHistory(days?: number): Promise<DailyStats[]>;
/**
 * Get aggregated tool usage across all days
 */
export declare function getToolUsageBreakdown(days?: number): Promise<Record<string, number>>;
/**
 * Get aggregated model usage across all days (stub implementation)
 */
export declare function getModelUsageBreakdown(days?: number): Promise<Record<string, number>>;
//# sourceMappingURL=statsTracker.d.ts.map