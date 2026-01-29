import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { getStatsHistory, getToolUsageBreakdown, type DailyStats } from "./statsTracker.js";
import { getHealthReportHistory } from "./healthCheck.js";

// QuickChart.io base URL
const QUICKCHART_URL = "https://quickchart.io/chart";

/**
 * Generate a chart URL using QuickChart.io
 */
function generateChartUrl(config: object): string {
    const chartConfig = encodeURIComponent(JSON.stringify(config));
    return `${QUICKCHART_URL}?c=${chartConfig}&w=500&h=300&bkg=white`;
}

/**
 * Generate usage trend chart (messages and tool calls over time)
 */
export async function generateUsageChart(days: number = 7): Promise<string> {
    const stats = await getStatsHistory(days);

    const labels = stats.map(s => s.date.slice(5)); // MM-DD format
    const messages = stats.map(s => s.messagesProcessed);
    const toolCalls = stats.map(s => s.totalToolCalls);

    const config = {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Messages",
                    data: messages,
                    borderColor: "#5865F2",
                    backgroundColor: "rgba(88, 101, 242, 0.1)",
                    fill: true,
                    tension: 0.3
                },
                {
                    label: "Tool Calls",
                    data: toolCalls,
                    borderColor: "#57F287",
                    backgroundColor: "rgba(87, 242, 135, 0.1)",
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Daily Usage Trend"
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    };

    return generateChartUrl(config);
}

/**
 * Generate response time trend chart
 */
export async function generateResponseTimeChart(days: number = 7): Promise<string> {
    const stats = await getStatsHistory(days);

    const labels = stats.map(s => s.date.slice(5));
    const avgTimes = stats.map(s => s.avgResponseTime);
    const maxTimes = stats.map(s => s.maxResponseTime);

    const config = {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Avg Response (ms)",
                    data: avgTimes,
                    borderColor: "#FEE75C",
                    backgroundColor: "rgba(254, 231, 92, 0.1)",
                    fill: true,
                    tension: 0.3
                },
                {
                    label: "Max Response (ms)",
                    data: maxTimes,
                    borderColor: "#ED4245",
                    backgroundColor: "rgba(237, 66, 69, 0.1)",
                    fill: false,
                    tension: 0.3,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Response Time Trend"
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    };

    return generateChartUrl(config);
}

/**
 * Generate tool usage pie chart
 */
export async function generateToolPieChart(days: number = 7): Promise<string> {
    const breakdown = await getToolUsageBreakdown(days);
    const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        // Return empty chart placeholder
        return generateChartUrl({
            type: "pie",
            data: {
                labels: ["No data"],
                datasets: [{ data: [1], backgroundColor: ["#99AAB5"] }]
            }
        });
    }

    // Take top 8 tools, group rest as "Other"
    const top8 = entries.slice(0, 8);
    const other = entries.slice(8).reduce((sum, [, count]) => sum + count, 0);

    const labels = top8.map(([name]) => name.replace("_", " "));
    const data = top8.map(([, count]) => count);

    if (other > 0) {
        labels.push("Other");
        data.push(other);
    }

    const colors = [
        "#5865F2", "#57F287", "#FEE75C", "#EB459E",
        "#ED4245", "#9B59B6", "#3498DB", "#1ABC9C", "#99AAB5"
    ];

    const config = {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, data.length)
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Tool Usage Distribution"
                }
            }
        }
    };

    return generateChartUrl(config);
}

/**
 * Generate health status timeline chart
 */
export async function generateHealthTimelineChart(days: number = 7): Promise<string> {
    const reports = await getHealthReportHistory(days);

    // Map status to numeric value for chart
    const statusMap = { healthy: 3, degraded: 2, critical: 1 };
    const colorMap = { healthy: "#57F287", degraded: "#FEE75C", critical: "#ED4245" };

    const labels = reports.map(r => r.date.slice(5));
    const data = reports.map(r => statusMap[r.overallStatus] || 0);
    const colors = reports.map(r => colorMap[r.overallStatus] || "#99AAB5");

    const config = {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Health Status",
                data,
                backgroundColor: colors
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Health Status Timeline"
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    min: 0,
                    max: 4,
                    ticks: {
                        callback: (value: number) => {
                            const labels: Record<number, string> = { 1: "Critical", 2: "Degraded", 3: "Healthy" };
                            return labels[value] || "";
                        }
                    }
                }
            }
        }
    };

    return generateChartUrl(config);
}

/**
 * Generate errors chart
 */
export async function generateErrorsChart(days: number = 7): Promise<string> {
    const stats = await getStatsHistory(days);

    const labels = stats.map(s => s.date.slice(5));
    const errors = stats.map(s => s.errors);

    const config = {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Errors",
                data: errors,
                backgroundColor: errors.map(e => e > 0 ? "#ED4245" : "#57F287")
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Daily Errors"
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    };

    return generateChartUrl(config);
}

/**
 * Generate summary statistics embed with chart URLs
 */
export async function generateStatsEmbed(days: number = 7): Promise<{
    embed: EmbedBuilder;
    chartUrls: string[];
}> {
    const stats = await getStatsHistory(days);

    // Calculate totals
    const totalMessages = stats.reduce((sum, s) => sum + s.messagesProcessed, 0);
    const totalToolCalls = stats.reduce((sum, s) => sum + s.totalToolCalls, 0);
    const totalErrors = stats.reduce((sum, s) => sum + s.errors, 0);

    // Calculate average response time across all days
    const allResponseTimes = stats.flatMap(s => s.responseTimes);
    const avgResponseTime = allResponseTimes.length > 0
        ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
        : 0;

    // Generate chart URLs
    const usageChartUrl = await generateUsageChart(days);
    const responseChartUrl = await generateResponseTimeChart(days);
    const toolPieUrl = await generateToolPieChart(days);
    const healthTimelineUrl = await generateHealthTimelineChart(days);

    const embed = new EmbedBuilder()
        .setTitle("📊 Usage Analytics")
        .setColor(0x5865F2)
        .setDescription(`Statistics for the last **${days} days**`)
        .addFields(
            { name: "📨 Messages", value: `${totalMessages}`, inline: true },
            { name: "🔧 Tool Calls", value: `${totalToolCalls}`, inline: true },
            { name: "❌ Errors", value: `${totalErrors}`, inline: true },
            { name: "⏱️ Avg Response", value: `${avgResponseTime}ms`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Use reactions to view different charts" });

    return {
        embed,
        chartUrls: [usageChartUrl, responseChartUrl, toolPieUrl, healthTimelineUrl]
    };
}

/**
 * Create embeds for each chart type
 */
export async function generateChartEmbeds(days: number = 7): Promise<EmbedBuilder[]> {
    const embeds: EmbedBuilder[] = [];

    // Usage Chart
    const usageUrl = await generateUsageChart(days);
    embeds.push(new EmbedBuilder()
        .setTitle("📈 Usage Trend")
        .setImage(usageUrl)
        .setColor(0x5865F2));

    // Response Time Chart
    const responseUrl = await generateResponseTimeChart(days);
    embeds.push(new EmbedBuilder()
        .setTitle("⏱️ Response Times")
        .setImage(responseUrl)
        .setColor(0xFEE75C));

    // Tool Pie Chart
    const toolUrl = await generateToolPieChart(days);
    embeds.push(new EmbedBuilder()
        .setTitle("🔧 Tool Distribution")
        .setImage(toolUrl)
        .setColor(0x57F287));

    // Health Timeline
    const healthUrl = await generateHealthTimelineChart(days);
    embeds.push(new EmbedBuilder()
        .setTitle("🏥 Health Timeline")
        .setImage(healthUrl)
        .setColor(0xEB459E));

    return embeds;
}
