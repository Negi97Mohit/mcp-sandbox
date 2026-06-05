/**
 * tracer.ts — Lightweight structured tracing for agent runs.
 *
 * Exports a singleton `tracer` that records spans for every LLM call,
 * tool execution, and agent hop. Spans are written to:
 *   1. Local JSON files in traces/ (always)
 *   2. Langfuse (if LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY are set)
 *
 * Why Langfuse over LangSmith: it's open-source, self-hostable, and
 * supports EU data residency — directly relevant to Basemark's Helsinki HQ.
 */
export interface SpanAttributes {
    [key: string]: string | number | boolean | undefined;
}
export interface TraceSpan {
    spanId: string;
    traceId: string;
    name: string;
    startTime: number;
    endTime?: number;
    attributes: SpanAttributes;
    status: "running" | "ok" | "error";
    error?: string;
}
export interface AgentTrace {
    traceId: string;
    taskId?: string;
    request?: string;
    startTime: number;
    endTime?: number;
    spans: TraceSpan[];
    metadata: Record<string, unknown>;
}
declare class AgentTracer {
    private traces;
    private spans;
    private tracesDir;
    private langfuseClient;
    constructor();
    private initLangfuse;
    /** Start a new root trace for an agent task */
    startTrace(taskId: string, request: string): string;
    /** Start a named span within a trace */
    startSpan(name: string, attributes?: SpanAttributes, traceId?: string): string;
    /** Complete a span with result attributes */
    endSpan(spanId: string, result?: SpanAttributes & {
        error?: string;
    }): void;
    /** Complete and persist a full trace */
    endTrace(traceId: string, metadata?: Record<string, unknown>): void;
    /** Record a single LLM generation — convenience method */
    recordGeneration(opts: {
        traceId?: string;
        name: string;
        model: string;
        input: any[];
        output: string;
        latencyMs: number;
        usage?: {
            prompt_tokens: number;
            completion_tokens: number;
        };
    }): void;
    /** Get all trace files for display */
    listTraces(limit?: number): string[];
}
export declare const tracer: AgentTracer;
export {};
//# sourceMappingURL=tracer.d.ts.map