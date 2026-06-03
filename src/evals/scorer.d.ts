/**
 * scorer.ts — Scoring functions for eval results.
 *
 * Two scores per eval case:
 * 1. toolAccuracyScore  — Did the agent call the expected tools?
 * 2. outputQualityScore — Did the output contain expected strings?
 *
 * The overall score is a weighted average (tools: 60%, output: 40%).
 * Critical cases that fail automatically fail the CI run.
 */
import type { EvalCase, EvalResult } from "../agents/agentTypes.js";
export declare function scoreToolAccuracy(actualTools: string[], expectedTools: string[]): number;
export declare function scoreOutputQuality(actualOutput: string, expectedContains: string[]): number;
export declare function computeOverallScore(toolScore: number, outputScore: number): number;
export declare function buildEvalResult(evalCase: EvalCase, actualTools: string[], actualOutput: string, latencyMs: number, error?: string): EvalResult;
//# sourceMappingURL=scorer.d.ts.map