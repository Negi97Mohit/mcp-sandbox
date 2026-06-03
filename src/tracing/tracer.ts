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

import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../config/env.js";

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

class AgentTracer {
  private traces: Map<string, AgentTrace> = new Map();
  private spans: Map<string, TraceSpan> = new Map();
  private tracesDir = path.join(process.cwd(), "traces");
  private langfuseClient: any = null;

  constructor() {
    if (!fs.existsSync(this.tracesDir)) {
      fs.mkdirSync(this.tracesDir, { recursive: true });
    }
    this.initLangfuse();
  }

  private initLangfuse() {
    const secretKey = CONFIG.LANGFUSE_SECRET_KEY;
    const publicKey = CONFIG.LANGFUSE_PUBLIC_KEY;
    const host = CONFIG.LANGFUSE_HOST || "https://cloud.langfuse.com";

    if (secretKey && publicKey) {
      try {
        // Dynamic import to avoid hard dependency — gracefully degrades if not installed
        import("langfuse").then(({ Langfuse }) => {
          this.langfuseClient = new Langfuse({ secretKey, publicKey, baseUrl: host });
          console.log("📊 Langfuse tracing: ENABLED →", host);
        }).catch(() => {
          console.log("📊 Langfuse package not installed. Run: npm install langfuse");
        });
      } catch {
        // Langfuse is optional
      }
    } else {
      console.log("📊 Tracing: LOCAL ONLY (set LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY to enable cloud)");
    }
  }

  /** Start a new root trace for an agent task */
  startTrace(taskId: string, request: string): string {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const trace: AgentTrace = {
      traceId,
      taskId,
      request: request.substring(0, 500),
      startTime: Date.now(),
      spans: [],
      metadata: {},
    };
    this.traces.set(traceId, trace);

    // Langfuse trace
    if (this.langfuseClient) {
      this.langfuseClient.trace({ id: traceId, name: `agent-task-${taskId}`, input: request });
    }

    return traceId;
  }

  /** Start a named span within a trace */
  startSpan(name: string, attributes: SpanAttributes = {}, traceId?: string): string {
    const spanId = `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const span: TraceSpan = {
      spanId,
      traceId: traceId ?? "no-trace",
      name,
      startTime: Date.now(),
      attributes,
      status: "running",
    };
    this.spans.set(spanId, span);

    // Attach to trace
    if (traceId) {
      const trace = this.traces.get(traceId);
      if (trace) trace.spans.push(span);
    }

    return spanId;
  }

  /** Complete a span with result attributes */
  endSpan(spanId: string, result: SpanAttributes & { error?: string } = {}) {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.status = result.error ? "error" : "ok";
    if (result.error !== undefined) {
      span.error = result.error;
    }
    Object.assign(span.attributes, result);

    if (this.langfuseClient && span.traceId !== "no-trace") {
      this.langfuseClient.span({
        traceId: span.traceId,
        name: span.name,
        startTime: new Date(span.startTime),
        endTime: new Date(span.endTime),
        metadata: span.attributes,
        statusMessage: span.error,
      });
    }
  }

  /** Complete and persist a full trace */
  endTrace(traceId: string, metadata: Record<string, unknown> = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    Object.assign(trace.metadata, metadata);

    // Persist to local JSON
    const filename = `trace-${traceId}.json`;
    const filepath = path.join(this.tracesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(trace, null, 2));
    console.log(`📊 Trace saved: traces/${filename}`);

    // Flush Langfuse
    if (this.langfuseClient) {
      this.langfuseClient.flushAsync?.().catch(() => {});
    }

    this.traces.delete(traceId);
  }

  /** Record a single LLM generation — convenience method */
  recordGeneration(opts: {
    traceId: string;
    name: string;
    model: string;
    input: any[];
    output: string;
    latencyMs: number;
    usage?: { prompt_tokens: number; completion_tokens: number };
  }) {
    if (this.langfuseClient) {
      this.langfuseClient.generation({
        traceId: opts.traceId,
        name: opts.name,
        model: opts.model,
        startTime: new Date(Date.now() - opts.latencyMs),
        endTime: new Date(),
        input: opts.input,
        output: opts.output,
        usage: opts.usage,
      });
    }
  }

  /** Get all trace files for display */
  listTraces(limit = 10): string[] {
    try {
      return fs
        .readdirSync(this.tracesDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse()
        .slice(0, limit);
    } catch {
      return [];
    }
  }
}

// Singleton
export const tracer = new AgentTracer();
