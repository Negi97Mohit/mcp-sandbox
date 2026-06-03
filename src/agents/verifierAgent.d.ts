/**
 * verifierAgent.ts — Runs tests and scores the confidence of an implementation.
 *
 * The Verifier is EXECUTE-ONLY for tests: it runs test commands and linters,
 * reads output, and produces a structured confidence score.
 *
 * Key insight: confidence is based on ACTUAL test results, not LLM self-assessment.
 * The LLM interprets results, but the score is grounded in real pass/fail counts.
 */
import { BaseAgent } from "./baseAgent.js";
import type { AgentInput, AgentResult } from "./agentTypes.js";
export declare class VerifierAgent extends BaseAgent {
    readonly name = "VerifierAgent";
    readonly agentType: "verify";
    protected allowedTools(): string[];
    protected buildSystemPrompt(input: AgentInput): string;
    run(input: AgentInput): Promise<AgentResult>;
    private parseConfidence;
    private parseTestResults;
}
//# sourceMappingURL=verifierAgent.d.ts.map