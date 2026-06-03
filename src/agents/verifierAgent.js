/**
 * verifierAgent.ts — Runs tests and scores the confidence of an implementation.
 *
 * The Verifier is EXECUTE-ONLY for tests: it runs test commands and linters,
 * reads output, and produces a structured confidence score.
 *
 * Key insight: confidence is based on ACTUAL test results, not LLM self-assessment.
 * The LLM interprets results, but the score is grounded in real pass/fail counts.
 */
import { BaseAgent } from "./baseAgent.js";
export class VerifierAgent extends BaseAgent {
    name = "VerifierAgent";
    agentType = "verify";
    allowedTools() {
        return ["run_shell", "read_file", "list_files"];
    }
    buildSystemPrompt(input) {
        const { context, subTask } = input;
        const modifiedFiles = subTask.context?.modifiedFiles ?? [];
        return `You are the VerifierAgent in a multi-agent software engineering system.

## Your Role
Verify that the implementation is correct by running tests, linters, and type checks.
You produce a structured confidence score based on ACTUAL test results — not guesses.

## Workspace
- OS: ${process.platform}
- Workspace: ${context.workspaceRoot || process.cwd()}
- Modified Files: ${modifiedFiles.join(", ") || "unknown"}

## Verification Strategy
Run these checks IN ORDER (stop and report if any critical check fails):

1. **Type Check**: npm run build (or tsc --noEmit)
2. **Lint**: npm run lint (if available, skip gracefully if not)
3. **Tests**: npm test (or npm run test -- --passWithNoTests)
4. **Smoke Check**: Read modified files to confirm the change makes logical sense.

## Instructions
- Run each check with run_shell.
- Parse stdout/stderr carefully to count passing/failing tests.
- A TypeScript compile error = CONFIDENCE 0.0 (hard fail).
- All tests passing = high confidence. Some failing = lower confidence.

## Output Format (REQUIRED — include this EXACTLY)
VERIFICATION_SUMMARY:
- TypeCheck: [pass|fail|skipped] — [details]
- Lint: [pass|fail|skipped] — [details]
- Tests: [X/Y passing] — [test runner output summary]
- LogicReview: [pass|fail] — [your assessment of the code change]

CONFIDENCE: [0.0–1.0]
CONFIDENCE_REASON: [Explain your score in one sentence]
TEST_COMMAND: [exact command you ran for tests]
TOTAL_TESTS: [number]
PASSING_TESTS: [number]
FAILING_TESTS: [number]

## Constraints
- Do NOT modify any files.
- Do NOT run destructive commands.
- If tests don't exist yet, state: Tests: 0/0 — no test suite found. CONFIDENCE: 0.6
`;
    }
    async run(input) {
        const result = await super.run(input);
        // Parse structured verification results
        result.confidence = this.parseConfidence(result.output);
        result.testResults = this.parseTestResults(result.output);
        return result;
    }
    parseConfidence(output) {
        const match = output.match(/CONFIDENCE:\s*([\d.]+)/);
        if (!match)
            return 0.5;
        return Math.min(1.0, Math.max(0.0, parseFloat(match[1] ?? "0.5")));
    }
    parseTestResults(output) {
        const totalMatch = output.match(/TOTAL_TESTS:\s*(\d+)/);
        const passingMatch = output.match(/PASSING_TESTS:\s*(\d+)/);
        const failingMatch = output.match(/FAILING_TESTS:\s*(\d+)/);
        const commandMatch = output.match(/TEST_COMMAND:\s*(.+)/);
        const total = parseInt(totalMatch?.[1] ?? "0", 10);
        const passing = parseInt(passingMatch?.[1] ?? "0", 10);
        const failing = parseInt(failingMatch?.[1] ?? "0", 10);
        return {
            totalTests: total,
            passing,
            failing,
            output: output.substring(0, 2000),
            command: commandMatch?.[1]?.trim() ?? "npm test",
        };
    }
}
//# sourceMappingURL=verifierAgent.js.map