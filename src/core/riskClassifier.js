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
// Patterns that match shell commands or actions to risk levels
const RISK_RULES = [
    {
        level: "critical",
        reason: "Destructive or irreversible operation",
        patterns: [
            /git\s+push\s+.*--force/i,
            /git\s+push\s+.*-f\b/i,
            /git\s+branch\s+.*-[Dd]\b/,
            /rm\s+-rf/i,
            /git\s+reset\s+--hard/i,
            /netlify\s+deploy\s+.*--prod/i,
            /DROP\s+TABLE/i,
        ],
    },
    {
        level: "high",
        reason: "Writes to shared repository or creates external artifacts",
        patterns: [
            /git\s+push(?!\s+.*--force)/i,
            /git\s+commit/i,
            /git\s+merge/i,
            /git\s+rebase/i,
            /netlify\s+deploy/i,
            /github_create_pr/i,
            /github_merge_pr/i,
        ],
    },
    {
        level: "medium",
        reason: "Modifies local state but recoverable",
        patterns: [
            /write_file/i,
            /git\s+checkout\s+-b/i,
            /git\s+add/i,
            /npm\s+install/i,
            /github_create_branch/i,
        ],
    },
];
export class RiskClassifier {
    /**
     * Classify a proposed action string (tool call name + args or shell command).
     */
    classify(action) {
        for (const rule of RISK_RULES) {
            for (const pattern of rule.patterns) {
                if (pattern.test(action)) {
                    return {
                        level: rule.level,
                        reason: rule.reason,
                        requiresApproval: rule.level === "high" || rule.level === "critical",
                    };
                }
            }
        }
        return {
            level: "low",
            reason: "Read-only or safe operation",
            requiresApproval: false,
        };
    }
    /**
     * Classify a complete OrchestratorDecision action.
     */
    classifyDecision(decision) {
        return this.classify(decision);
    }
    getRiskEmoji(level) {
        const map = {
            low: "🟢",
            medium: "🟡",
            high: "🟠",
            critical: "🔴",
        };
        return map[level];
    }
}
export const riskClassifier = new RiskClassifier();
//# sourceMappingURL=riskClassifier.js.map