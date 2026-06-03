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
import type { AgentContext, OrchestratorResult } from "./agentTypes.js";
export declare class Orchestrator {
    private planner;
    private implementer;
    private verifier;
    /**
     * Main entry point. Takes a natural language engineering request
     * and orchestrates the full plan → implement → verify → decide loop.
     */
    run(request: string, context: AgentContext): Promise<OrchestratorResult>;
    private buildResult;
    /** Heuristic: extract likely relevant filenames from the request */
    private discoverRelatedFiles;
    private generatePRTitle;
    private generatePRBody;
    private getDiff;
}
export declare const orchestrator: Orchestrator;
//# sourceMappingURL=orchestrator.d.ts.map