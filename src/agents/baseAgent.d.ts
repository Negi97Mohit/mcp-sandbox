/**
 * baseAgent.ts — Abstract base class for all specialist agents.
 *
 * Provides:
 * - A typed ReAct loop (reason → act → observe → repeat)
 * - Tool call execution via the shared executeToolCall dispatcher
 * - Structured result building with observability data
 * - Token usage + latency tracking for every LLM call
 */
import type { AgentInput, AgentResult, SubTaskType, ToolCallRecord, TokenUsage } from "./agentTypes.js";
export declare abstract class BaseAgent {
    /** Human-readable name for logs and traces */
    abstract readonly name: string;
    abstract readonly agentType: SubTaskType;
    /** Subclasses return their specialized system prompt */
    protected abstract buildSystemPrompt(input: AgentInput): string;
    /**
     * Which tool names this agent is allowed to call.
     * Return undefined to allow all tools (admin agents only).
     */
    protected abstract allowedTools(): string[] | undefined;
    /**
     * Core run loop: sends messages to LLM, executes tool calls,
     * and synthesizes a final answer. Maximum 6 iterations to prevent loops.
     */
    run(input: AgentInput): Promise<AgentResult>;
    protected buildResult(input: AgentInput, success: boolean, output: string, toolCallsMade: ToolCallRecord[], latencyMs: number, tokenUsage: TokenUsage, error?: string): AgentResult;
}
//# sourceMappingURL=baseAgent.d.ts.map