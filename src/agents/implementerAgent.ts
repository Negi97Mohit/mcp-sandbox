/**
 * implementerAgent.ts — Executes the plan produced by PlannerAgent.
 *
 * The Implementer has WRITE access: it can edit files, run shell commands,
 * create branches, and stage changes. It does NOT push or create PRs.
 *
 * It receives the plan steps from PlannerAgent as part of its prompt context.
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentInput, AgentResult, PlanStep } from "./agentTypes.js";

export class ImplementerAgent extends BaseAgent {
  readonly name = "ImplementerAgent";
  readonly agentType = "implement" as const;

  protected allowedTools(): string[] {
    return [
      "run_shell",
      "read_file",
      "write_file",
      "list_files",
      "github_read_file",
    ];
  }

  protected buildSystemPrompt(input: AgentInput): string {
    const { context, subTask } = input;

    // Extract plan from context if provided
    const plan = subTask.context?.plan as PlanStep[] | undefined;
    const planText = plan
      ? plan.map((s) => `Step ${s.stepNumber}: ${s.description}${s.toolToUse ? ` [${s.toolToUse}]` : ""}`).join("\n")
      : "No structured plan provided — use your best judgment.";

    return `You are the ImplementerAgent in a multi-agent software engineering system.

## Your Role
Execute the implementation plan step-by-step. Write code, run commands, and modify files.
Your changes should be clean, minimal, and exactly what was planned — no scope creep.

## Workspace
- OS: ${process.platform}
- Workspace: ${context.workspaceRoot || process.cwd()}
${context.repoOwner ? `- GitHub Repo: ${context.repoOwner}/${context.repoName}` : ""}

## Execution Plan
${planText}

## Instructions
1. Follow the plan steps IN ORDER. Don't skip steps.
2. After each file change, verify it with read_file.
3. For shell commands, check stdout/stderr — don't assume success.
4. Stage changes with: git add -A (but do NOT commit or push — Orchestrator handles that).
5. If a step fails, report the error and stop — do not attempt to work around it silently.

## Output Format
At the end, report:
IMPLEMENTATION_STATUS: success | partial | failed
FILES_MODIFIED: [comma-separated list of modified files]
NOTES: [anything the Verifier should know]

## Constraints
- Do NOT run: git push, git merge, git force-push, rm -rf, or any destructive command.
- If you need to run a risky command, say: ESCALATE: [reason] and stop.
- Max shell output to include in your reasoning: 500 characters per command.
`;
  }

  async run(input: AgentInput): Promise<AgentResult> {
    const result = await super.run(input);

    // Extract modified files from output
    result.modifiedFiles = this.parseModifiedFiles(result.output);

    return result;
  }

  private parseModifiedFiles(output: string): string[] {
    const match = output.match(/FILES_MODIFIED:\s*\[([^\]]+)\]/);
    if (!match || !match[1]) return [];
    return match[1]
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }
}
