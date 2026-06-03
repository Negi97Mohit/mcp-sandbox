/**
 * implementerAgent.ts — Executes the plan produced by PlannerAgent.
 *
 * The Implementer has WRITE access: it can edit files, run shell commands,
 * create branches, and stage changes. It does NOT push or create PRs.
 *
 * It receives the plan steps from PlannerAgent as part of its prompt context.
 */
import { BaseAgent } from "./baseAgent.js";
import type { AgentInput, AgentResult } from "./agentTypes.js";
export declare class ImplementerAgent extends BaseAgent {
    readonly name = "ImplementerAgent";
    readonly agentType: "implement";
    protected allowedTools(): string[];
    protected buildSystemPrompt(input: AgentInput): string;
    run(input: AgentInput): Promise<AgentResult>;
    private parseModifiedFiles;
}
//# sourceMappingURL=implementerAgent.d.ts.map