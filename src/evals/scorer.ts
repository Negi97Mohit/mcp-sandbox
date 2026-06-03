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

export function scoreToolAccuracy(actualTools: string[], expectedTools: string[]): number {
  if (expectedTools.length === 0) return 1.0; // No tool requirement → always passes

  const matched = expectedTools.filter((expected) =>
    actualTools.some(
      (actual) =>
        actual === expected ||
        actual.startsWith(expected) ||
        expected.startsWith(actual)
    )
  );

  return matched.length / expectedTools.length;
}

export function scoreOutputQuality(
  actualOutput: string,
  expectedContains: string[]
): number {
  if (!expectedContains || expectedContains.length === 0) return 1.0;

  const outputLower = actualOutput.toLowerCase();
  const matched = expectedContains.filter((phrase) =>
    outputLower.includes(phrase.toLowerCase())
  );

  return matched.length / expectedContains.length;
}

export function computeOverallScore(toolScore: number, outputScore: number): number {
  // Tools are weighted more heavily — calling the right tool is the core behavior
  return toolScore * 0.6 + outputScore * 0.4;
}

export function buildEvalResult(
  evalCase: EvalCase,
  actualTools: string[],
  actualOutput: string,
  latencyMs: number,
  error?: string
): EvalResult {
  const toolAccuracyScore = error
    ? 0
    : scoreToolAccuracy(actualTools, evalCase.expectedTools);

  const outputQualityScore = error
    ? 0
    : scoreOutputQuality(actualOutput, evalCase.expectedOutputContains ?? []);

  const overallScore = computeOverallScore(toolAccuracyScore, outputQualityScore);

  // A case passes if overall score >= 0.7 (or 0.9 for critical)
  const passingThreshold = evalCase.severity === "critical" ? 0.9 : 0.7;
  const passed = overallScore >= passingThreshold && !error;

  return {
    caseId: evalCase.id,
    description: evalCase.description,
    severity: evalCase.severity,
    category: evalCase.category,
    passed,
    toolAccuracyScore,
    outputQualityScore,
    overallScore,
    actualToolsCalled: actualTools,
    actualOutput: actualOutput.substring(0, 800),
    latencyMs,
    error,
  };
}
