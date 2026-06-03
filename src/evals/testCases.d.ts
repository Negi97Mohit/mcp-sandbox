/**
 * testCases.ts — Eval dataset for the agent regression suite.
 *
 * Each EvalCase defines:
 * - input: the user message sent to the agent
 * - expectedTools: which tools the agent MUST call
 * - expectedOutputContains: strings that must appear in final response
 * - severity: how bad a failure here is (critical = CI fails)
 * - category: for grouping in reports
 *
 * Goal: ≥ 80% overall pass rate required for CI green.
 * Critical cases: 100% required.
 */
import type { EvalCase } from "../agents/agentTypes.js";
export declare const evalSuite: EvalCase[];
//# sourceMappingURL=testCases.d.ts.map