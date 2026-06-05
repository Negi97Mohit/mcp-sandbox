/**
 * baseAgent.ts — Abstract base class for all specialist agents.
 *
 * Provides:
 * - A typed ReAct loop (reason → act → observe → repeat)
 * - Tool call execution via the shared executeToolCall dispatcher
 * - Structured result building with observability data
 * - Token usage + latency tracking for every LLM call
 */

import { callOpenRouter } from "../llm/openRouter.js";
import { executeToolCall } from "../tools/index.js";
import { tracer } from "../tracing/tracer.js";
import type {
  AgentInput,
  AgentResult,
  SubTaskType,
  ToolCallRecord,
  TokenUsage,
} from "./agentTypes.js";
import type { ToolContext } from "../types/toolContext.js";
import { validateAgentOutput } from "../core/aiValidation.js";

export abstract class BaseAgent {
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
  async run(input: AgentInput): Promise<AgentResult> {
    const spanId = tracer.startSpan(`${this.name}.run`, {
      taskId: input.taskId,
      request: input.request.substring(0, 200),
    });

    const startTime = Date.now();
    const toolCallsMade: ToolCallRecord[] = [];
    let totalTokenUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    const systemPrompt = this.buildSystemPrompt(input);

    // Build initial message history: system + any passed history + new task
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...input.history.filter((m) => m.role !== "system"), // Don't duplicate system
      { role: "user", content: input.request },
    ];

    const toolContext: ToolContext = {
      channelId: input.context.channelId,
      userId: input.context.userId,
      sendLog: input.context.sendLog,
      ...(input.context.workspaceRoot !== undefined ? { workspaceRoot: input.context.workspaceRoot } : {}),
    };

    let finalOutput = "";
    let iterationCount = 0;
    const MAX_ITERATIONS = 6;

    try {
      while (iterationCount < MAX_ITERATIONS) {
        iterationCount++;
        const llmStart = Date.now();

        const aiMessage = await callOpenRouter(messages, this.allowedTools());
        const llmLatency = Date.now() - llmStart;

        // Track token usage if provided
        if (aiMessage.usage) {
          totalTokenUsage.promptTokens += aiMessage.usage.prompt_tokens ?? 0;
          totalTokenUsage.completionTokens += aiMessage.usage.completion_tokens ?? 0;
          totalTokenUsage.totalTokens += aiMessage.usage.total_tokens ?? 0;
        }

        // Preserve assistant message in history
        const historyEntry: any = {
          role: "assistant",
          content: aiMessage.content,
          tool_calls: aiMessage.tool_calls,
        };
        if (aiMessage.reasoning_details) {
          historyEntry.reasoning_details = aiMessage.reasoning_details;
        }
        messages.push(historyEntry);

        // If no tool calls → we have the final answer
        if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
          finalOutput = aiMessage.content || "Agent completed with no content.";
          break;
        }

        // Execute each tool call
        for (const toolCall of aiMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolStart = Date.now();

          await input.context.sendLog(`🔧 [${this.name}] → \`${toolName}\``);

          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }

          const toolResult = await executeToolCall(toolName, args, toolContext);
          const toolLatency = Date.now() - toolStart;

          toolCallsMade.push({
            toolName,
            args,
            result: toolResult,
            latencyMs: toolLatency,
            success: !("error" in (toolResult as any)),
          });

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      if (iterationCount >= MAX_ITERATIONS && !finalOutput) {
        finalOutput = messages[messages.length - 1]?.content ?? "Max iterations reached.";
      }

      const latencyMs = Date.now() - startTime;

      tracer.endSpan(spanId, {
        success: true,
        latencyMs,
        toolCallCount: toolCallsMade.length,
        iterations: iterationCount,
      });

      return this.buildResult(input, true, finalOutput, toolCallsMade, latencyMs, totalTokenUsage);
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      tracer.endSpan(spanId, { success: false, error: error.message });

      return this.buildResult(
        input,
        false,
        "",
        toolCallsMade,
        latencyMs,
        totalTokenUsage,
        error.message
      );
    }
  }

  protected buildResult(
    input: AgentInput,
    success: boolean,
    output: string,
    toolCallsMade: ToolCallRecord[],
    latencyMs: number,
    tokenUsage: TokenUsage,
    error?: string
  ): AgentResult {
    const result: AgentResult = {
      taskId: input.taskId,
      agentType: this.agentType,
      success,
      output,
      toolCallsMade,
      latencyMs,
      tokenUsage,
    };
    if (error !== undefined) result.error = error;

    // Run AI Output Verification Scaffold
    if (success && output) {
      try {
        const report = validateAgentOutput(this.agentType, output, input.request);
        result.aiVerificationReport = report;
        
        // Log validation details
        input.context.sendLog(
          `🔍 **[AI Verification]** Output Correctness Score: **${report.score}/100**\n` +
          `• Schema Match: ${report.metrics.schemaMatch ? "✅" : "❌"} | ` +
          `Syntax Valid: ${report.metrics.syntaxValid ? "✅" : "❌"} | ` +
          `Safety Verified: ${report.metrics.safetyVerified ? "✅" : "❌"} | ` +
          `Logical Consistency: ${report.metrics.logicalConsistency ? "✅" : "❌"}`
        );
      } catch (err: any) {
        console.error("AI Validation error:", err);
      }
    }

    return result;
  }
}
