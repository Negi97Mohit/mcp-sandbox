/**
 * orchestrator.ts — Master coordinator for the multi-agent SDLC system.
 *
 * Receives a high-level request (e.g., "Fix the auth bug in issue #12"),
 * decomposes it into subtasks, routes to specialist agents, and decides
 * whether to auto-commit, request approval, or escalate to the human.
 *
 * Decision Logic:
 * - confidence >= 0.85 AND all tests passing → auto_commit (create PR)
 * - confidence >= 0.60 → request_approval (show diff to human)
 * - confidence < 0.60 → escalate (explain why we failed)
 * - Any ESCALATE signal from Implementer → escalate immediately
 */
import { PlannerAgent } from "./plannerAgent.js";
import { ImplementerAgent } from "./implementerAgent.js";
import { VerifierAgent } from "./verifierAgent.js";
import { approvalGate } from "../core/approvalGate.js";
import { riskClassifier } from "../core/riskClassifier.js";
import { tracer } from "../tracing/tracer.js";
import { githubClient } from "../integrations/github.js";
import { graphStore } from "../core/GraphStore.js";
const AUTO_COMMIT_THRESHOLD = 0.85;
const APPROVAL_THRESHOLD = 0.60;
export class Orchestrator {
    planner = new PlannerAgent();
    implementer = new ImplementerAgent();
    verifier = new VerifierAgent();
    /**
     * Main entry point. Takes a natural language engineering request
     * and orchestrates the full plan → implement → verify → decide loop.
     */
    async run(request, context) {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const traceId = tracer.startTrace(taskId, request);
        const startTime = Date.now();
        await context.sendLog(`🎯 **Orchestrator** | Task \`${taskId}\`\n` +
            `📋 Request: ${request.substring(0, 200)}`);
        let planResult;
        let implementResult;
        let verifyResult;
        try {
            // ── Phase 1: Planning ─────────────────────────────────────────────
            await context.sendLog("🧠 **Phase 1/3**: PlannerAgent analyzing codebase...");
            const planNode = graphStore.addNode({
                type: "agent_plan",
                label: "Phase 1: Planning",
                status: "running",
                createdBy: "agent:PlannerAgent",
                colorCode: "indigo",
                details: { description: request }
            });
            const planSpan = tracer.startSpan("orchestrator.plan", { taskId }, traceId);
            const planSubTask = {
                id: `${taskId}-plan`,
                type: "plan",
                description: request,
                relatedFiles: await this.discoverRelatedFiles(request, context),
                ...(context.issueNumber !== undefined ? { issueNumber: context.issueNumber } : {}),
            };
            planResult = await this.planner.run({
                taskId,
                request,
                subTask: planSubTask,
                history: [],
                context,
            });
            tracer.endSpan(planSpan, {
                success: planResult.success,
                confidence: planResult.confidence,
                planSteps: planResult.plan?.length ?? 0,
                latencyMs: planResult.latencyMs,
            });
            graphStore.updateNode(planNode.id, {
                status: planResult.success ? "success" : "failed",
                details: { ...planNode.details, plan: planResult.plan, error: planResult.error }
            });
            if (!planResult.success) {
                const result = this.buildResult(taskId, request, { action: "escalate", reason: `Planning failed: ${planResult.error}` }, planResult, undefined, undefined, startTime, traceId);
                tracer.endTrace(traceId, { decision: "escalate", reason: "plan_failed" });
                return result;
            }
            await context.sendLog(`✅ **Plan ready** | ${planResult.plan?.length ?? 0} steps | ` +
                `Confidence: ${((planResult.confidence ?? 0.5) * 100).toFixed(0)}%`);
            // If planning confidence is very low, escalate before implementing
            if ((planResult.confidence ?? 0.5) < 0.3) {
                await context.sendLog("⚠️ Planner confidence too low to proceed safely. Escalating to human.");
                const result = this.buildResult(taskId, request, { action: "escalate", reason: `Planner confidence ${((planResult.confidence ?? 0) * 100).toFixed(0)}% is below safe threshold.\n\nPlanner output:\n${planResult.output.substring(0, 800)}` }, planResult, undefined, undefined, startTime, traceId);
                tracer.endTrace(traceId, { decision: "escalate", reason: "low_plan_confidence" });
                return result;
            }
            // ── Phase 2: Implementation ────────────────────────────────────────
            await context.sendLog("⚙️ **Phase 2/3**: ImplementerAgent executing plan...");
            const implNode = graphStore.addNode({
                type: "agent_implement",
                label: "Phase 2: Implementation",
                status: "running",
                createdBy: "agent:ImplementerAgent",
                colorCode: "amber",
                details: { description: `Execute this plan:\n${planResult.output}` }
            });
            const implSpan = tracer.startSpan("orchestrator.implement", { taskId }, traceId);
            const implSubTask = {
                id: `${taskId}-impl`,
                type: "implement",
                description: `Execute this plan:\n${planResult.output}`,
                relatedFiles: planResult.plan?.map((s) => s.expectedOutput).filter(Boolean),
                context: { plan: planResult.plan },
            };
            implementResult = await this.implementer.run({
                taskId,
                request: implSubTask.description,
                subTask: implSubTask,
                history: [],
                context,
            });
            tracer.endSpan(implSpan, {
                success: implementResult.success,
                filesModified: implementResult.modifiedFiles?.length ?? 0,
                latencyMs: implementResult.latencyMs,
            });
            graphStore.updateNode(implNode.id, {
                status: implementResult.success ? "success" : "failed",
                details: { ...implNode.details, modifiedFiles: implementResult.modifiedFiles, error: implementResult.error }
            });
            if (implementResult.success) {
                const commitHash = await graphStore.captureGitCheckpoint(implNode.id, "Post Implementation");
                if (commitHash) {
                    graphStore.updateNode(implNode.id, {
                        details: { ...implNode.details, gitCommitHash: commitHash, revertible: true }
                    });
                }
            }
            // Check for explicit escalation signal from implementer
            if (implementResult.output.includes("ESCALATE:")) {
                const escalateMatch = implementResult.output.match(/ESCALATE:\s*(.+)/);
                const escalateReason = escalateMatch?.[1] ?? "Implementer signalled escalation";
                const result = this.buildResult(taskId, request, { action: "escalate", reason: escalateReason }, planResult, implementResult, undefined, startTime, traceId);
                tracer.endTrace(traceId, { decision: "escalate", reason: "implementer_escalated" });
                return result;
            }
            if (!implementResult.success) {
                const result = this.buildResult(taskId, request, { action: "escalate", reason: `Implementation failed: ${implementResult.error}` }, planResult, implementResult, undefined, startTime, traceId);
                tracer.endTrace(traceId, { decision: "escalate", reason: "impl_failed" });
                return result;
            }
            await context.sendLog(`✅ **Implementation done** | Files: ${implementResult.modifiedFiles?.join(", ") || "unknown"}`);
            // ── Phase 3: Verification ──────────────────────────────────────────
            await context.sendLog("🔬 **Phase 3/3**: VerifierAgent running tests...");
            const verifyNode = graphStore.addNode({
                type: "agent_verify",
                label: "Phase 3: Verification",
                status: "running",
                createdBy: "agent:VerifierAgent",
                colorCode: "emerald",
                details: { description: `Verify implementation for: ${request}` }
            });
            const verifySpan = tracer.startSpan("orchestrator.verify", { taskId }, traceId);
            const verifySubTask = {
                id: `${taskId}-verify`,
                type: "verify",
                description: `Verify implementation for: ${request}`,
                context: { modifiedFiles: implementResult.modifiedFiles },
            };
            verifyResult = await this.verifier.run({
                taskId,
                request: verifySubTask.description,
                subTask: verifySubTask,
                history: [],
                context,
            });
            tracer.endSpan(verifySpan, {
                success: verifyResult.success,
                confidence: verifyResult.confidence,
                testsTotal: verifyResult.testResults?.totalTests ?? 0,
                testsPassing: verifyResult.testResults?.passing ?? 0,
                latencyMs: verifyResult.latencyMs,
            });
            graphStore.updateNode(verifyNode.id, {
                status: verifyResult.success ? "success" : "failed",
                details: { ...verifyNode.details, testResults: verifyResult.testResults, confidence: verifyResult.confidence }
            });
            const confidence = verifyResult.confidence ?? 0.5;
            const testsOk = (verifyResult.testResults?.failing ?? 0) === 0;
            await context.sendLog(`🔬 **Verification**: Confidence ${(confidence * 100).toFixed(0)}% | ` +
                `Tests: ${verifyResult.testResults?.passing ?? "?"}/${verifyResult.testResults?.totalTests ?? "?"} passing`);
            // ── Decision ───────────────────────────────────────────────────────
            let decision;
            if (confidence >= AUTO_COMMIT_THRESHOLD && testsOk) {
                // High confidence + all tests pass → propose auto-commit
                // But creating a PR is HIGH risk → still needs approval gate
                const prTitle = this.generatePRTitle(request);
                const prBody = this.generatePRBody(request, planResult, implementResult, verifyResult);
                decision = { action: "auto_commit", prTitle, prBody };
                // Apply risk gate: creating a PR is high risk
                const risk = riskClassifier.classify("github_create_pr");
                if (risk.requiresApproval) {
                    await context.sendLog("🟠 **Approval Required**: Creating PR is a high-risk action.");
                    const approval = await approvalGate.request({
                        id: approvalGate.generateId(),
                        channelId: context.channelId,
                        requestedBy: context.userId,
                        action: `Create PR: "${prTitle}"`,
                        reason: `All ${verifyResult.testResults?.passing ?? 0} tests passing. Confidence: ${(confidence * 100).toFixed(0)}%`,
                        riskLevel: "high",
                        context: prBody.substring(0, 800),
                        timeoutMs: 5 * 60 * 1000, // 5 minutes
                    });
                    if (approval.outcome !== "approved") {
                        decision = { action: "abort", reason: `PR creation ${approval.outcome} by human at approval gate` };
                    }
                    else {
                        // Create the actual PR
                        try {
                            if (context.repoOwner && context.repoName) {
                                const pr = await githubClient.createPR({
                                    owner: context.repoOwner,
                                    repo: context.repoName,
                                    title: prTitle,
                                    body: prBody,
                                    head: `fix/${taskId}`,
                                    base: "main",
                                });
                                await context.sendLog(`✅ **PR Created**: ${pr.html_url}`);
                            }
                        }
                        catch (prError) {
                            await context.sendLog(`⚠️ PR creation failed: ${prError.message}. Changes are staged locally.`);
                        }
                    }
                }
            }
            else if (confidence >= APPROVAL_THRESHOLD) {
                // Medium confidence → request human review of the diff
                const diff = await this.getDiff(context);
                decision = {
                    action: "request_approval",
                    diff,
                    reason: `Confidence ${(confidence * 100).toFixed(0)}% is below auto-commit threshold (${AUTO_COMMIT_THRESHOLD * 100}%). ` +
                        `${verifyResult.testResults?.failing ?? 0} test(s) failing. Please review the diff.`,
                };
            }
            else {
                // Low confidence → escalate
                decision = {
                    action: "escalate",
                    reason: `Confidence too low (${(confidence * 100).toFixed(0)}%). ` +
                        `${verifyResult.testResults?.failing ?? 0} test(s) failing.\n\nVerifier output:\n${verifyResult.output.substring(0, 600)}`,
                };
            }
            const result = this.buildResult(taskId, request, decision, planResult, implementResult, verifyResult, startTime, traceId);
            tracer.endTrace(traceId, {
                decision: decision.action,
                confidence,
                totalLatencyMs: result.totalLatencyMs,
            });
            graphStore.addNode({
                type: "agent_decision",
                label: "Orchestrator Decision",
                status: decision.action === "escalate" ? "escalated" : decision.action === "abort" ? "aborted" : "success",
                createdBy: "system:Orchestrator",
                colorCode: decision.action === "auto_commit" ? "emerald" : decision.action === "request_approval" ? "amber" : "rose",
                details: { decision: decision.action, reason: decision.reason, prTitle: decision.prTitle }
            });
            return result;
        }
        catch (error) {
            tracer.endTrace(traceId, { error: error.message });
            return this.buildResult(taskId, request, { action: "escalate", reason: `Orchestrator error: ${error.message}` }, planResult, implementResult, verifyResult, startTime, traceId);
        }
    }
    buildResult(taskId, request, decision, planResult, implementResult, verifyResult, startTime = Date.now(), traceId) {
        const result = {
            taskId,
            originalRequest: request,
            decision,
            totalLatencyMs: Date.now() - startTime,
        };
        if (planResult !== undefined)
            result.planResult = planResult;
        if (implementResult !== undefined)
            result.implementResult = implementResult;
        if (verifyResult !== undefined)
            result.verifyResult = verifyResult;
        if (traceId !== undefined)
            result.traceId = traceId;
        return result;
    }
    /** Heuristic: extract likely relevant filenames from the request */
    async discoverRelatedFiles(request, _context) {
        // Extract filenames mentioned in the request
        const fileMatches = request.match(/[\w/.-]+\.(ts|js|py|go|rs|json|yaml|yml|md)/g);
        return fileMatches ?? [];
    }
    generatePRTitle(request) {
        const cleaned = request.replace(/fix|implement|add|update|the|a|an/gi, "").trim();
        return `fix: ${cleaned.substring(0, 60)}`;
    }
    generatePRBody(request, plan, impl, verify) {
        return `## 🤖 Automated Fix by MCP-Sandbox Agent

**Original Request**: ${request}

## Plan
${plan.plan?.map((s) => `- Step ${s.stepNumber}: ${s.description}`).join("\n") || plan.output.substring(0, 400)}

## Implementation
Modified files: ${impl.modifiedFiles?.join(", ") || "see diff"}

## Verification
${verify.output.substring(0, 600)}

**Confidence Score**: ${((verify.confidence ?? 0) * 100).toFixed(0)}%
**Tests**: ${verify.testResults?.passing ?? "?"}/${verify.testResults?.totalTests ?? "?"} passing

---
*Generated by [mcp-sandbox](https://github.com/Negi97Mohit/mcp-sandbox) multi-agent SDLC system*
*Trace ID: ${Date.now()}*
`;
    }
    async getDiff(context) {
        try {
            const { executeToolCall } = await import("../tools/index.js");
            const result = await executeToolCall("run_shell", { command: "git diff --stat HEAD" }, { channelId: context.channelId, userId: context.userId, sendLog: context.sendLog });
            return result.stdout ?? result.output ?? "Could not fetch diff";
        }
        catch {
            return "Diff unavailable";
        }
    }
}
export const orchestrator = new Orchestrator();
//# sourceMappingURL=orchestrator.js.map