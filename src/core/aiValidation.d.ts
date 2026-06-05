export interface AiVerificationReport {
    success: boolean;
    score: number;
    metrics: {
        schemaMatch: number;
        syntaxValid: number;
        safetyVerified: number;
        logicalConsistency: number;
    };
    details: string[];
}
/**
 * Validates TS/JS syntax using the TypeScript compiler API
 */
export declare function checkTypescriptSyntax(code: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validates text against safety policies (dangerous commands, forced git push)
 */
export declare function checkSafety(text: string): {
    safe: boolean;
    error?: string;
};
/**
 * Validates output based on agent type
 */
export declare function validateAgentOutput(agentType: string, output: string, request: string): AiVerificationReport;
//# sourceMappingURL=aiValidation.d.ts.map