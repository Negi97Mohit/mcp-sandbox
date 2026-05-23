export interface RateLimitError extends Error {
    isRateLimit: true;
    resetAt: Date | null;
    allModelsExhausted: boolean;
}
/**
 * Call OpenRouter with automatic free-model fallback on 429 rate-limit errors.
 *
 * If ALL models are exhausted a RateLimitError is thrown with `allModelsExhausted: true`
 * and a `resetAt` timestamp so callers can show a meaningful message.
 */
export declare function callOpenRouter(messages: any[]): Promise<any>;
//# sourceMappingURL=openRouter.d.ts.map