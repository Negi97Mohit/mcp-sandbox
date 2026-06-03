/**
 * plannerAgent.ts — Reads the codebase and produces a structured, step-by-step plan.
 *
 * The Planner is READ-ONLY: it can run shell commands to inspect code, read files,
 * and list directories, but it cannot write files or push to git.
 *
 * Output: A PlanStep[] array embedded in the AgentResult.plan field.
 */
import { BaseAgent } from "./baseAgent.js";
import type { AgentInput, AgentResult } from "./agentTypes.js";
export declare class PlannerAgent extends BaseAgent {
    readonly name = "PlannerAgent";
    readonly agentType: "plan";
    protected allowedTools(): string[];
    protected buildSystemPrompt(input: AgentInput): string;
    run(input: AgentInput): Promise<AgentResult>;
    private parsePlan;
    private parseConfidence;
}
//# sourceMappingURL=plannerAgent.d.ts.map