/**
 * evalRunner.ts — Runs the eval suite against the live agent and collects results.
 *
 * For each EvalCase:
 * 1. Sends the input to callOpenRouter with the full tool list
 * 2. Executes any tool calls the agent makes
 * 3. Collects the final output
 * 4. Scores with scorer.ts
 * 5. Aggregates into an EvalReport
 *
 * Run via: npm run eval
 * Also callable from Discord via: !eval
 */
import type { EvalReport } from "../agents/agentTypes.js";
/** Run the full eval suite */
export declare function runEvalSuite(opts?: {
    verbose?: boolean;
    categories?: string[];
}): Promise<EvalReport>;
//# sourceMappingURL=evalRunner.d.ts.map