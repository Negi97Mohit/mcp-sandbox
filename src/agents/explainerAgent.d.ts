import { BaseAgent } from "./baseAgent.js";
import type { AgentInput } from "./agentTypes.js";
export declare class ExplainerAgent extends BaseAgent {
    readonly name = "ExplainerAgent";
    readonly agentType: "review";
    protected allowedTools(): string[];
    protected buildSystemPrompt(input: AgentInput): string;
}
//# sourceMappingURL=explainerAgent.d.ts.map