/**
 * agentTypes.ts — Shared type definitions for the multi-agent SDLC system.
 *
 * Every agent (Planner, Implementer, Verifier) and the Orchestrator
 * share these contracts so they can be composed and swapped independently.
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";
export interface RiskClassification {
    level: RiskLevel;
    reason: string;
    requiresApproval: boolean;
}
export type SubTaskType = "plan" | "implement" | "verify" | "review" | "escalate";
export interface SubTask {
    id: string;
    type: SubTaskType;
    description: string;
    context?: Record<string, unknown> | undefined;
    relatedFiles?: string[] | undefined;
    issueNumber?: number | undefined;
}
export interface AgentInput {
    taskId: string;
    request: string;
    subTask: SubTask;
    /** Full conversation history to be passed to LLM */
    history: any[];
    context: AgentContext;
}
export interface AgentContext {
    channelId: string;
    userId: string;
    workspaceRoot?: string | undefined;
    repoOwner?: string | undefined;
    repoName?: string | undefined;
    issueNumber?: number | undefined;
    sendLog: (text: string) => Promise<void>;
}
export interface AgentResult {
    taskId: string;
    agentType: SubTaskType;
    success: boolean;
    output: string;
    plan?: PlanStep[];
    confidence?: number;
    testResults?: TestResult;
    modifiedFiles?: string[];
    toolCallsMade: ToolCallRecord[];
    latencyMs: number;
    tokenUsage?: TokenUsage;
    error?: string | undefined;
}
export interface PlanStep {
    stepNumber: number;
    description: string;
    toolToUse?: string | undefined;
    expectedOutput?: string | undefined;
}
export interface TestResult {
    totalTests: number;
    passing: number;
    failing: number;
    output: string;
    command: string;
}
export interface ToolCallRecord {
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
    latencyMs: number;
    success: boolean;
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export type OrchestratorDecision = {
    action: "auto_commit";
    prTitle: string;
    prBody: string;
} | {
    action: "request_approval";
    diff: string;
    reason: string;
} | {
    action: "escalate";
    reason: string;
} | {
    action: "abort";
    reason: string;
};
export interface OrchestratorResult {
    taskId: string;
    originalRequest: string;
    decision: OrchestratorDecision;
    planResult?: AgentResult | undefined;
    implementResult?: AgentResult | undefined;
    verifyResult?: AgentResult | undefined;
    totalLatencyMs: number;
    traceId?: string | undefined;
}
export type EvalSeverity = "critical" | "high" | "medium" | "low";
export interface EvalCase {
    id: string;
    description: string;
    input: string;
    expectedTools: string[];
    expectedOutputContains?: string[];
    severity: EvalSeverity;
    /** Category for grouping in reports */
    category: "shell" | "file" | "git" | "netlify" | "github" | "rca" | "orchestration";
}
export interface EvalResult {
    caseId: string;
    description: string;
    severity: EvalSeverity;
    category: string;
    passed: boolean;
    toolAccuracyScore: number;
    outputQualityScore: number;
    overallScore: number;
    actualToolsCalled: string[];
    actualOutput: string;
    latencyMs: number;
    error?: string | undefined;
}
export interface EvalReport {
    runId: string;
    timestamp: string;
    totalCases: number;
    passed: number;
    failed: number;
    overallPassRate: number;
    toolAccuracyAvg: number;
    outputQualityAvg: number;
    criticalFailures: EvalResult[];
    results: EvalResult[];
    /** Whether CI should fail this run */
    ciShouldFail: boolean;
}
//# sourceMappingURL=agentTypes.d.ts.map