/**
 * approvalGate.ts — Human-in-the-loop approval system.
 *
 * When the Orchestrator wants to perform a HIGH or CRITICAL risk action,
 * it calls approvalGate.request(). The gate:
 *   1. Posts a Discord embed showing the proposed action + risk level
 *   2. Adds ✅ and ❌ reaction buttons
 *   3. PAUSES execution (returns a Promise that suspends the agent)
 *   4. Resolves when a human reacts, or times out after `timeoutMs`
 *
 * This implements the EU AI Act Article 14 pattern: high-risk automated
 * actions have mandatory human oversight before execution.
 */
import type { RiskLevel } from "../agents/agentTypes.js";
export interface ApprovalRequest {
    id: string;
    channelId: string;
    requestedBy: string;
    action: string;
    reason: string;
    riskLevel: RiskLevel;
    context?: string;
    timeoutMs: number;
}
export type ApprovalOutcome = "approved" | "rejected" | "timeout";
export interface ApprovalResult {
    outcome: ApprovalOutcome;
    approvedBy?: string;
    elapsedMs: number;
}
export declare class ApprovalGate {
    /**
     * Request human approval for a high-risk action.
     * This function SUSPENDS until the human reacts or the timeout fires.
     */
    request(req: ApprovalRequest): Promise<ApprovalResult>;
    /**
     * Called by the Discord client's messageReactionAdd event handler.
     * Resolves the pending approval if the reactor is an admin.
     */
    handleReaction(messageId: string, emoji: string, userId: string, isAdmin: boolean): Promise<boolean>;
    /** Generate a unique approval request ID */
    generateId(): string;
}
export declare const approvalGate: ApprovalGate;
//# sourceMappingURL=approvalGate.d.ts.map