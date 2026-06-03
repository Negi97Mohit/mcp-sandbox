/**
 * plannerAgent.ts — Reads the codebase and produces a structured, step-by-step plan.
 *
 * The Planner is READ-ONLY: it can run shell commands to inspect code, read files,
 * and list directories, but it cannot write files or push to git.
 *
 * Output: A PlanStep[] array embedded in the AgentResult.plan field.
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentInput, AgentResult, PlanStep } from "./agentTypes.js";

export class PlannerAgent extends BaseAgent {
  readonly name = "PlannerAgent";
  readonly agentType = "plan" as const;

  protected allowedTools(): string[] {
    return ["run_shell", "read_file", "list_files", "find_git_repos"];
  }

  protected buildSystemPrompt(input: AgentInput): string {
    const { context, subTask } = input;
    return `You are the PlannerAgent in a multi-agent software engineering system.

## Your Role
Your ONLY job is to READ and UNDERSTAND the codebase, then produce a PRECISE, NUMBERED execution plan.
You do NOT write code. You do NOT modify files. You are a senior engineer doing code review + planning.

## Workspace
- OS: ${process.platform}
- Workspace: ${context.workspaceRoot || process.cwd()}
${context.repoOwner ? `- GitHub Repo: ${context.repoOwner}/${context.repoName}` : ""}
${subTask.issueNumber ? `- GitHub Issue: #${subTask.issueNumber}` : ""}

## Related Files
${subTask.relatedFiles?.map((f) => `- ${f}`).join("\n") || "Discover files using list_files and read_file."}

## Instructions
1. Use list_files and read_file to understand the relevant code.
2. Use run_shell for: git log, git diff, grep, cat — read-only operations only.
3. Produce a numbered plan with EXACT steps: what file to edit, what change to make, what command to run.
4. Format your final plan EXACTLY as:

PLAN:
1. [Step description] — Tool: [tool_name], File: [filename or N/A]
2. [Step description] — Tool: [tool_name], File: [filename or N/A]
...
CONFIDENCE: [0.0–1.0]
REASON: [Why you're confident/uncertain]

## Constraints
- Maximum 8 plan steps.
- Be specific. "Edit src/auth/login.ts line 42" not "fix the bug".
- If you cannot determine the fix with high confidence, state CONFIDENCE: 0.3 and explain.
`;
  }

  async run(input: AgentInput): Promise<AgentResult> {
    const result = await super.run(input);

    // Parse structured plan from output
    result.plan = this.parsePlan(result.output);
    result.confidence = this.parseConfidence(result.output);

    return result;
  }

  private parsePlan(output: string): PlanStep[] {
    const planSection = output.match(/PLAN:\n([\s\S]*?)(?=CONFIDENCE:|$)/);
    if (!planSection) return [];

    const lines = planSection[1]?.trim().split("\n") ?? [];
    const steps: PlanStep[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s+(.+?)(?:\s+—\s+Tool:\s+(\w+))?(?:,\s+File:\s+(.+))?$/);
      if (match) {
        const step: PlanStep = {
          stepNumber: parseInt(match[1] ?? "0", 10),
          description: match[2]?.trim() ?? "",
        };
        if (match[3]) step.toolToUse = match[3].trim();
        if (match[4]) step.expectedOutput = match[4].trim();
        steps.push(step);
      }
    }

    return steps;
  }

  private parseConfidence(output: string): number {
    const match = output.match(/CONFIDENCE:\s*([\d.]+)/);
    if (!match) return 0.5;
    return Math.min(1.0, Math.max(0.0, parseFloat(match[1] ?? "0.5")));
  }
}
