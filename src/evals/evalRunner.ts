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

import { callOpenRouter } from "../llm/openRouter.js";
import { executeToolCall } from "../tools/index.js";
import { evalSuite } from "./testCases.js";
import { buildEvalResult, computeOverallScore } from "./scorer.js";
import { generateEvalReport, saveEvalReport, printEvalSummary } from "./evalReport.js";
import type { EvalCase, EvalReport, EvalResult } from "../agents/agentTypes.js";
import type { ToolContext } from "../types/toolContext.js";

const SYSTEM_PROMPT = `You are a DevOps Agent connected to the user's local machine.
SYSTEM INFO:
- OS: ${process.platform}
- User Workspace: ${process.cwd()}
- ADMIN ACCESS: You have full system access.

CRITICAL INSTRUCTIONS:
1. Use tools to answer questions. Don't make up answers.
2. If a file doesn't exist, report the error — don't invent its contents.
3. Never run destructive commands like rm -rf /.
4. Use 'write_file' and 'run_shell' to execute tasks.
`;

/** Run a single eval case and return its result */
async function runSingleCase(
  evalCase: EvalCase,
  verbose = false
): Promise<EvalResult> {
  const startTime = Date.now();
  const actualTools: string[] = [];
  let finalOutput = "";

  // No-op sendLog for evals (suppress Discord calls)
  const sendLog = async (_: string) => {};
  const context: ToolContext = {
    channelId: "eval",
    userId: "eval-runner",
    sendLog,
  };

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: evalCase.input },
  ];

  try {
    let iterations = 0;
    const MAX_ITER = 5;

    while (iterations < MAX_ITER) {
      iterations++;
      const aiMessage = await callOpenRouter(messages);

      const histEntry: any = {
        role: "assistant",
        content: aiMessage.content,
        tool_calls: aiMessage.tool_calls,
      };
      messages.push(histEntry);

      if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
        finalOutput = aiMessage.content ?? "";
        break;
      }

      for (const toolCall of aiMessage.tool_calls) {
        const toolName = toolCall.function.name;
        actualTools.push(toolName);

        let args: any = {};
        try {
          args = JSON.parse(toolCall.function.arguments ?? "{}");
        } catch {
          args = {};
        }

        if (verbose) {
          console.log(`  🔧 [${evalCase.id}] Tool: ${toolName}`);
        }

        let toolResult: any;
        try {
          toolResult = await executeToolCall(toolName, args, context);
        } catch (e: any) {
          toolResult = { error: e.message };
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    const latencyMs = Date.now() - startTime;
    return buildEvalResult(evalCase, actualTools, finalOutput, latencyMs);
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return buildEvalResult(evalCase, actualTools, "", latencyMs, error.message);
  }
}

/** Run the full eval suite */
export async function runEvalSuite(
  opts: { verbose?: boolean; categories?: string[] } = {}
): Promise<EvalReport> {
  const { verbose = false, categories } = opts;

  const casesToRun = categories
    ? evalSuite.filter((c) => categories.includes(c.category))
    : evalSuite;

  console.log(`\n🧪 Running ${casesToRun.length} eval cases...\n`);

  const results: EvalResult[] = [];
  let passed = 0;

  for (const evalCase of casesToRun) {
    process.stdout.write(`  [${evalCase.id}] ${evalCase.description}... `);

    const result = await runSingleCase(evalCase, verbose);
    results.push(result);

    if (result.passed) {
      passed++;
      console.log(`✅ (${(result.overallScore * 100).toFixed(0)}% | ${result.latencyMs}ms)`);
    } else {
      console.log(
        `❌ (tool: ${(result.toolAccuracyScore * 100).toFixed(0)}% | ` +
        `output: ${(result.outputQualityScore * 100).toFixed(0)}% | ` +
        `${result.latencyMs}ms)` +
        (result.error ? ` ERROR: ${result.error}` : "")
      );
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  const report = generateEvalReport(results);
  await saveEvalReport(report);
  printEvalSummary(report);

  return report;
}

/** Entry point for `npm run eval` */
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  MCP-Sandbox Agent Eval Regression Suite");
  console.log("═══════════════════════════════════════════════");

  const categoryArgs = process.argv.slice(2);
  const categories = categoryArgs.length > 0 ? categoryArgs : undefined;
  const report = await runEvalSuite({
    verbose: true,
    ...(categories ? { categories } : {})
  });

  if (report.ciShouldFail) {
    console.error("\n💥 CI FAILED: Eval pass rate below threshold or critical failures detected.");
    process.exit(1);
  } else {
    console.log("\n✅ CI PASSED: All thresholds met.");
    process.exit(0);
  }
}

// Run if executed directly
const isMain = process.argv[1]?.endsWith("evalRunner.js") || process.argv[1]?.endsWith("evalRunner.ts");
if (isMain) {
  main().catch((err) => {
    console.error("Eval runner crashed:", err);
    process.exit(1);
  });
}
