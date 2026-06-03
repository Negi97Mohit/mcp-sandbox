/**
 * evalReport.ts — Generates, saves, and prints eval reports.
 *
 * Reports are saved to eval_results/ as dated JSON files.
 * The Discord embed format is ready to post directly to a channel.
 */
import type { EvalReport, EvalResult } from "../agents/agentTypes.js";
export declare function generateEvalReport(results: EvalResult[]): EvalReport;
export declare function saveEvalReport(report: EvalReport): Promise<string>;
export declare function printEvalSummary(report: EvalReport): void;
/** Format report as a Discord-ready markdown string */
export declare function formatDiscordReport(report: EvalReport): string;
//# sourceMappingURL=evalReport.d.ts.map