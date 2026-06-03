/**
 * evalReport.ts — Generates, saves, and prints eval reports.
 *
 * Reports are saved to eval_results/ as dated JSON files.
 * The Discord embed format is ready to post directly to a channel.
 */

import * as fs from "fs";
import * as path from "path";
import type { EvalReport, EvalResult } from "../agents/agentTypes.js";

const RESULTS_DIR = path.join(process.cwd(), "eval_results");
const PASS_RATE_THRESHOLD = 0.80; // 80% required for CI green

export function generateEvalReport(results: EvalResult[]): EvalReport {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const overallPassRate = results.length > 0 ? passed / results.length : 0;

  const toolAccuracyAvg =
    results.reduce((sum, r) => sum + r.toolAccuracyScore, 0) / (results.length || 1);

  const outputQualityAvg =
    results.reduce((sum, r) => sum + r.outputQualityScore, 0) / (results.length || 1);

  const criticalFailures = results.filter(
    (r) => !r.passed && r.severity === "critical"
  );

  // CI fails if: pass rate below threshold OR any critical case fails
  const ciShouldFail = overallPassRate < PASS_RATE_THRESHOLD || criticalFailures.length > 0;

  return {
    runId: `eval-${Date.now()}`,
    timestamp: new Date().toISOString(),
    totalCases: results.length,
    passed,
    failed,
    overallPassRate,
    toolAccuracyAvg,
    outputQualityAvg,
    criticalFailures,
    results,
    ciShouldFail,
  };
}

export async function saveEvalReport(report: EvalReport): Promise<string> {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const filename = `eval-${new Date().toISOString().slice(0, 10)}-${report.runId.slice(-6)}.json`;
  const filepath = path.join(RESULTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  console.log(`\n📄 Eval report saved: eval_results/${filename}`);
  return filepath;
}

export function printEvalSummary(report: EvalReport): void {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  EVAL RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Total Cases     : ${report.totalCases}`);
  console.log(`  Passed          : ${report.passed} ✅`);
  console.log(`  Failed          : ${report.failed} ❌`);
  console.log(`  Pass Rate       : ${(report.overallPassRate * 100).toFixed(1)}% (threshold: 80%)`);
  console.log(`  Tool Accuracy   : ${(report.toolAccuracyAvg * 100).toFixed(1)}%`);
  console.log(`  Output Quality  : ${(report.outputQualityAvg * 100).toFixed(1)}%`);

  if (report.criticalFailures.length > 0) {
    console.log(`\n  🔴 CRITICAL FAILURES (${report.criticalFailures.length}):`);
    for (const f of report.criticalFailures) {
      console.log(`    - [${f.caseId}] ${f.description}`);
      if (f.error) console.log(`      Error: ${f.error}`);
    }
  }

  // Category breakdown
  const categories = [...new Set(report.results.map((r) => r.category))];
  console.log("\n  Category Breakdown:");
  for (const cat of categories) {
    const catResults = report.results.filter((r) => r.category === cat);
    const catPassed = catResults.filter((r) => r.passed).length;
    const pct = ((catPassed / catResults.length) * 100).toFixed(0);
    const bar = "█".repeat(Math.round(catPassed / catResults.length * 10));
    console.log(`    ${cat.padEnd(16)} ${pct.padStart(3)}% ${bar}`);
  }

  console.log("\n  CI Decision:", report.ciShouldFail ? "❌ FAIL" : "✅ PASS");
  console.log("═══════════════════════════════════════════════\n");
}

/** Format report as a Discord-ready markdown string */
export function formatDiscordReport(report: EvalReport): string {
  const passEmoji = report.ciShouldFail ? "❌" : "✅";
  const lines = [
    `## ${passEmoji} Eval Regression Report`,
    `**Run ID**: \`${report.runId}\` | **${new Date(report.timestamp).toLocaleString()}**`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Pass Rate | **${(report.overallPassRate * 100).toFixed(1)}%** (${report.passed}/${report.totalCases}) |`,
    `| Tool Accuracy | ${(report.toolAccuracyAvg * 100).toFixed(1)}% |`,
    `| Output Quality | ${(report.outputQualityAvg * 100).toFixed(1)}% |`,
    `| CI Status | ${report.ciShouldFail ? "❌ FAIL" : "✅ PASS"} |`,
  ];

  if (report.criticalFailures.length > 0) {
    lines.push("", "**🔴 Critical Failures:**");
    for (const f of report.criticalFailures) {
      lines.push(`- \`${f.caseId}\`: ${f.description}${f.error ? ` — ${f.error}` : ""}`);
    }
  }

  const failedNonCritical = report.results.filter((r) => !r.passed && r.severity !== "critical");
  if (failedNonCritical.length > 0) {
    lines.push("", "**Failed Cases:**");
    for (const f of failedNonCritical.slice(0, 5)) {
      lines.push(`- \`${f.caseId}\` [${f.severity}]: ${f.description} (score: ${(f.overallScore * 100).toFixed(0)}%)`);
    }
    if (failedNonCritical.length > 5) {
      lines.push(`  *...and ${failedNonCritical.length - 5} more*`);
    }
  }

  return lines.join("\n");
}
