import { EmbedBuilder } from "discord.js";
export interface HealthCheckResult {
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
    details?: string;
    responseTimeMs?: number;
}
export interface StoredHealthReport {
    timestamp: string;
    date: string;
    overallStatus: "healthy" | "degraded" | "critical";
    checks: HealthCheckResult[];
}
/**
 * Check if the OpenRouter API key is configured correctly
 */
export declare function checkApiKey(): HealthCheckResult;
/**
 * Check if Discord token is configured
 */
export declare function checkDiscordToken(): HealthCheckResult;
/**
 * Test the OpenRouter API with a simple request
 */
export declare function checkModelConnectivity(): Promise<HealthCheckResult>;
/**
 * Check if all tools are properly registered
 */
export declare function checkToolsAvailability(): HealthCheckResult;
/**
 * Get system information
 */
export declare function getSystemInfo(): HealthCheckResult;
/**
 * Run all health checks and generate a comprehensive report
 */
export declare function generateHealthReport(force?: boolean): Promise<{
    embed: EmbedBuilder;
    overallStatus: "healthy" | "degraded" | "critical";
}>;
/**
 * Get health report history (last N days)
 */
export declare function getHealthReportHistory(days?: number): Promise<StoredHealthReport[]>;
/**
 * Generate an embed showing health report history
 */
export declare function generateHistoryEmbed(days?: number): Promise<EmbedBuilder>;
//# sourceMappingURL=healthCheck.d.ts.map