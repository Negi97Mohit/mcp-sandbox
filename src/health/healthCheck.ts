import { CONFIG } from "../config/env.js";
import { getAllTools } from "../tools/index.js";
import { EmbedBuilder } from "discord.js";
import * as os from "os";
import * as fs from "fs/promises";
import * as path from "path";

// Health reports storage directory inside AppData
const appName = "Gaki - Development Kit";
const home = os.homedir();
const userDataPath = process.platform === "win32"
    ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), appName)
    : process.platform === "darwin"
        ? path.join(home, "Library", "Application Support", appName)
        : path.join(home, ".config", appName);

const REPORTS_DIR = path.join(userDataPath, "health_reports");

export interface HealthCheckResult {
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
    details?: string;
    responseTimeMs?: number;
}

/**
 * Utility to redact sensitive tokens in logs and reports.
 */
function redactToken(token: string | undefined): string {
    if (!token) return "";
    if (token.length <= 8) return "***";
    return `${token.substring(0, 4)}...${token.slice(-4)}`;
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
export function checkApiKey(): HealthCheckResult {
    const apiKey = CONFIG.OPENROUTER_API_KEY;

    if (!apiKey) {
        return {
            name: "API Key",
            status: "fail",
            message: "❌ OpenRouter API Key is missing",
            details: "Set OPENROUTER_API_KEY in your .env file"
        };
    }

    if (!apiKey.startsWith("sk-or-")) {
        return {
            name: "API Key",
            status: "warn",
            message: "⚠️ API Key format looks unusual",
            details: "Expected prefix: sk-or-"
        };
    }

    return {
        name: "API Key",
        status: "pass",
        message: "✅ API Key configured",
        details: `Key: ${redactToken(apiKey)}`
    };
}

/**
 * Check if Discord token is configured
 */
export function checkDiscordToken(): HealthCheckResult {
    const token = CONFIG.DISCORD_TOKEN;

    if (!token) {
        return {
            name: "Discord Token",
            status: "fail",
            message: "❌ Discord Token is missing",
            details: "Set DISCORD_TOKEN in your .env file"
        };
    }

    return {
        name: "Discord Token",
        status: "pass",
        message: "✅ Discord Token configured",
        details: `Token: ${redactToken(token)}`
    };
}

// Cache for health reports to prevent duplicate API/health checks on startup and navigation
let lastReportPromise: Promise<{
    embed: EmbedBuilder;
    overallStatus: "healthy" | "degraded" | "critical";
}> | null = null;
let lastReportTimestamp = 0;
const REPORT_CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Test the OpenRouter API with a simple request
 */
export async function checkModelConnectivity(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        const response = await fetch("https://openrouter.ai/api/v1/key", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            },
        });

        const responseTimeMs = Date.now() - startTime;

        if (!response.ok) {
            const errorBody = await response.text();
            return {
                name: "Model Connectivity",
                status: "fail",
                message: `❌ API returned ${response.status}`,
                details: errorBody.substring(0, 200),
                responseTimeMs
            };
        }

        const resData = await response.json();
        const info = resData?.data;

        if (!info) {
            return {
                name: "Model Connectivity",
                status: "fail",
                message: "❌ Invalid API response structure",
                details: JSON.stringify(resData).substring(0, 200),
                responseTimeMs
            };
        }

        const limitStr = info.limit !== null ? `$${info.limit.toFixed(2)}` : "unlimited";
        const usageStr = info.usage !== null ? `$${info.usage.toFixed(2)}` : "$0.00";
        const tier = info.is_free_tier ? "Free Tier" : "Paid Credits Tier";

        return {
            name: "Model Connectivity",
            status: "pass",
            message: `✅ Connected to OpenRouter (${responseTimeMs}ms)`,
            details: `Label: ${info.label || "Default"}\nLimit: ${limitStr}\nUsage: ${usageStr}\nAccount: ${tier}`,
            responseTimeMs
        };

    } catch (error: any) {
        const responseTimeMs = Date.now() - startTime;
        return {
            name: "Model Connectivity",
            status: "fail",
            message: "❌ Failed to connect to OpenRouter",
            details: error.message,
            responseTimeMs
        };
    }
}

/**
 * Check if all tools are properly registered
 */
export function checkToolsAvailability(): HealthCheckResult {
    try {
        const tools = getAllTools();
        const toolCount = tools.length;
        const toolNames = tools.map(t => t.function.name);

        if (toolCount === 0) {
            return {
                name: "Tools",
                status: "fail",
                message: "❌ No tools registered",
                details: "Check src/tools/index.ts"
            };
        }

        return {
            name: "Tools",
            status: "pass",
            message: `✅ ${toolCount} tools registered`,
            details: toolNames.join(", ")
        };

    } catch (error: any) {
        return {
            name: "Tools",
            status: "fail",
            message: "❌ Error loading tools",
            details: error.message
        };
    }
}

/**
 * Get system information
 */
export function getSystemInfo(): HealthCheckResult {
    const uptimeSeconds = process.uptime();
    const uptimeFormatted = formatUptime(uptimeSeconds);

    return {
        name: "System Info",
        status: "pass",
        message: "📊 System Status",
        details: `OS: ${os.platform()} ${os.release()}\nNode: ${process.version}\nUptime: ${uptimeFormatted}\nMemory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
}

function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Run all health checks and generate a comprehensive report
 */
export async function generateHealthReport(force: boolean = false): Promise<{
    embed: EmbedBuilder;
    overallStatus: "healthy" | "degraded" | "critical";
}> {
    const now = Date.now();
    if (!force && lastReportPromise && (now - lastReportTimestamp) < REPORT_CACHE_TTL_MS) {
        return lastReportPromise;
    }

    lastReportTimestamp = now;
    lastReportPromise = (async () => {
        // Run all checks
        const results: HealthCheckResult[] = [
            checkApiKey(),
            checkDiscordToken(),
            await checkModelConnectivity(),
            checkToolsAvailability(),
            getSystemInfo()
        ];

        // Determine overall status
        const hasFail = results.some(r => r.status === "fail");
        const hasWarn = results.some(r => r.status === "warn");

        let overallStatus: "healthy" | "degraded" | "critical";
        let embedColor: number;
        let statusEmoji: string;

        if (hasFail) {
            overallStatus = "critical";
            embedColor = 0xFF0000; // Red
            statusEmoji = "🔴";
        } else if (hasWarn) {
            overallStatus = "degraded";
            embedColor = 0xFFAA00; // Orange
            statusEmoji = "🟡";
        } else {
            overallStatus = "healthy";
            embedColor = 0x00FF00; // Green
            statusEmoji = "🟢";
        }

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji} Bot Health Report`)
            .setColor(embedColor)
            .setTimestamp()
            .setFooter({ text: "DevOps Agent Health Check" });

        // Add fields for each check
        for (const result of results) {
            embed.addFields({
                name: result.name,
                value: `${result.message}${result.details ? `\n\`\`\`${result.details}\`\`\`` : ""}`,
                inline: false
            });
        }

        // Add summary field
        const passCount = results.filter(r => r.status === "pass").length;
        const warnCount = results.filter(r => r.status === "warn").length;
        const failCount = results.filter(r => r.status === "fail").length;

        embed.setDescription(
            `**Status:** ${overallStatus.toUpperCase()}\n` +
            `✅ Passed: ${passCount} | ⚠️ Warnings: ${warnCount} | ❌ Failed: ${failCount}`
        );

        // Save report to file
        await saveHealthReport(results, overallStatus);

        return { embed, overallStatus };
    })();

    return lastReportPromise;
}

/**
 * Save health report to a JSON file
 */
async function saveHealthReport(
    checks: HealthCheckResult[],
    overallStatus: "healthy" | "degraded" | "critical"
): Promise<void> {
    try {
        // Ensure directory exists
        await fs.mkdir(REPORTS_DIR, { recursive: true });

        const now = new Date();
        const dateStr = now.toISOString().split("T")[0]!; // YYYY-MM-DD
        const timestamp = now.toISOString();

        const report: StoredHealthReport = {
            timestamp,
            date: dateStr,
            overallStatus,
            checks
        };

        // Save with date-based filename
        const filename = `health_${dateStr}.json`;
        const filepath = path.join(REPORTS_DIR, filename);

        await fs.writeFile(filepath, JSON.stringify(report, null, 2), "utf-8");
        console.log(`📁 Health report saved to: ${filepath}`);

    } catch (error) {
        console.error("❌ Failed to save health report:", error);
    }
}

/**
 * Get health report history (last N days)
 */
export async function getHealthReportHistory(days: number = 7): Promise<StoredHealthReport[]> {
    try {
        await fs.mkdir(REPORTS_DIR, { recursive: true });

        const files = await fs.readdir(REPORTS_DIR);
        const reports: StoredHealthReport[] = [];

        // Get last N days of reports
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0]!;
            const filename = `health_${dateStr}.json`;

            if (files.includes(filename)) {
                const filepath = path.join(REPORTS_DIR, filename);
                const content = await fs.readFile(filepath, "utf-8");
                reports.push(JSON.parse(content) as StoredHealthReport);
            }
        }

        return reports;
    } catch (error) {
        console.error("❌ Failed to read health report history:", error);
        return [];
    }
}

/**
 * Generate an embed showing health report history
 */
export async function generateHistoryEmbed(days: number = 7): Promise<EmbedBuilder> {
    const reports = await getHealthReportHistory(days);

    const embed = new EmbedBuilder()
        .setTitle("📊 Health Report History")
        .setColor(0x5865F2) // Discord blurple
        .setTimestamp()
        .setFooter({ text: `Last ${days} days` });

    if (reports.length === 0) {
        embed.setDescription("No health reports found.");
        return embed;
    }

    // Build history summary
    const lines: string[] = [];
    for (const report of reports) {
        const statusEmoji = report.overallStatus === "healthy" ? "🟢" :
            report.overallStatus === "degraded" ? "🟡" : "🔴";
        const date = new Date(report.timestamp);
        const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

        const passCount = report.checks.filter(c => c.status === "pass").length;
        const failCount = report.checks.filter(c => c.status === "fail").length;

        lines.push(`${statusEmoji} **${report.date}** at ${timeStr} — ✅${passCount} ❌${failCount}`);
    }

    embed.setDescription(lines.join("\n"));

    return embed;
}
