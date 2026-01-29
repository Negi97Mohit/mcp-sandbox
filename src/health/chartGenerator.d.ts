import { EmbedBuilder } from "discord.js";
/**
 * Generate usage trend chart (messages and tool calls over time)
 */
export declare function generateUsageChart(days?: number): Promise<string>;
/**
 * Generate response time trend chart
 */
export declare function generateResponseTimeChart(days?: number): Promise<string>;
/**
 * Generate tool usage pie chart
 */
export declare function generateToolPieChart(days?: number): Promise<string>;
/**
 * Generate health status timeline chart
 */
export declare function generateHealthTimelineChart(days?: number): Promise<string>;
/**
 * Generate errors chart
 */
export declare function generateErrorsChart(days?: number): Promise<string>;
/**
 * Generate summary statistics embed with chart URLs
 */
export declare function generateStatsEmbed(days?: number): Promise<{
    embed: EmbedBuilder;
    chartUrls: string[];
}>;
/**
 * Create embeds for each chart type
 */
export declare function generateChartEmbeds(days?: number): Promise<EmbedBuilder[]>;
//# sourceMappingURL=chartGenerator.d.ts.map