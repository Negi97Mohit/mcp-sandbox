/**
 * riskClassifier.ts — Classifies actions by risk level to determine
 * whether they require human approval before execution.
 *
 * This is the "human-in-the-loop boundary" — explicitly defining
 * what agents do alone vs. what they escalate vs. what they hand back.
 *
 * Risk Taxonomy:
 * - LOW:      Read operations, git status, list files → fully autonomous
 * - MEDIUM:   Creating branches, staging files, running tests → confirm once
 * - HIGH:     Creating PRs, committing code, deploying → requires approval
 * - CRITICAL: Force push, delete branch, production deploy → always manual
 */
import type { RiskClassification, RiskLevel } from "../agents/agentTypes.js";
export declare class RiskClassifier {
    /**
     * Classify a proposed action string (tool call name + args or shell command).
     */
    classify(action: string): RiskClassification;
    /**
     * Classify a complete OrchestratorDecision action.
     */
    classifyDecision(decision: string): RiskClassification;
    getRiskEmoji(level: RiskLevel): string;
}
export declare const riskClassifier: RiskClassifier;
//# sourceMappingURL=riskClassifier.d.ts.map