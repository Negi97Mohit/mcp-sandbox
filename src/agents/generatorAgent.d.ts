import { BaseAgent } from "./baseAgent.js";
import type { AgentInput } from "./agentTypes.js";
export declare class GeneratorAgent extends BaseAgent {
    readonly name = "GeneratorAgent";
    readonly agentType: "implement";
    protected allowedTools(): string[];
    protected buildSystemPrompt(input: AgentInput): string;
}
//# sourceMappingURL=generatorAgent.d.ts.map