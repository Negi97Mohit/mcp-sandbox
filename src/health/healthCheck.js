import { CONFIG } from "../config/env.js";
import { allTools } from "../tools/index.js";
import { EmbedBuilder } from "discord.js";
import * as os from "os";
import * as fs from "fs/promises";
import * as path from "path";
// Health reports storage directory
const REPORTS_DIR = path.join(process.cwd(), "health_reports");
/**
 * Check if the OpenRouter API key is configured correctly
 */
export function checkApiKey() {
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
        details: `Key: ${apiKey.substring(0, 12)}...${apiKey.slice(-4)}`
    };
}
/**
 * Check if Discord token is configured
 */
export function checkDiscordToken() {
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
        details: `Token: ${token.substring(0, 10)}...`
    };
}
/**
 * Test the OpenRouter API with a simple request
 */
export async function checkModelConnectivity() {
    const startTime = Date.now();
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://discord-agent.com",
                "X-Title": "DevOps Agent Health Check",
            },
            body: JSON.stringify({
                model: CONFIG.MODEL_NAME,
                messages: [{ role: "user", content: "Reply with only: OK" }],
                max_tokens: 5,
            }),
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
        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            return {
                name: "Model Connectivity",
                status: "warn",
                message: "⚠️ API responded but no choices returned",
                details: JSON.stringify(data).substring(0, 200),
                responseTimeMs
            };
        }
        return {
            name: "Model Connectivity",
            status: "pass",
            message: `✅ Model responding (${responseTimeMs}ms)`,
            details: `Model: ${CONFIG.MODEL_NAME}`,
            responseTimeMs
        };
    }
    catch (error) {
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
export function checkToolsAvailability() {
    try {
        const toolCount = allTools.length;
        const toolNames = allTools.map(t => t.function.name);
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
    }
    catch (error) {
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
export function getSystemInfo() {
    const uptimeSeconds = process.uptime();
    const uptimeFormatted = formatUptime(uptimeSeconds);
    return {
        name: "System Info",
        status: "pass",
        message: "📊 System Status",
        details: `OS: ${os.platform()} ${os.release()}\nNode: ${process.version}\nUptime: ${uptimeFormatted}\nMemory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
}
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}
/**
 * Run all health checks and generate a comprehensive report
 */
export async function generateHealthReport() {
    // Run all checks
    const results = [
        checkApiKey(),
        checkDiscordToken(),
        await checkModelConnectivity(),
        checkToolsAvailability(),
        getSystemInfo()
    ];
    // Determine overall status
    const hasFail = results.some(r => r.status === "fail");
    const hasWarn = results.some(r => r.status === "warn");
    let overallStatus;
    let embedColor;
    let statusEmoji;
    if (hasFail) {
        overallStatus = "critical";
        embedColor = 0xFF0000; // Red
        statusEmoji = "🔴";
    }
    else if (hasWarn) {
        overallStatus = "degraded";
        embedColor = 0xFFAA00; // Orange
        statusEmoji = "🟡";
    }
    else {
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
    embed.setDescription(`**Status:** ${overallStatus.toUpperCase()}\n` +
        `✅ Passed: ${passCount} | ⚠️ Warnings: ${warnCount} | ❌ Failed: ${failCount}`);
    // Save report to file
    await saveHealthReport(results, overallStatus);
    return { embed, overallStatus };
}
/**
 * Save health report to a JSON file
 */
async function saveHealthReport(checks, overallStatus) {
    try {
        // Ensure directory exists
        await fs.mkdir(REPORTS_DIR, { recursive: true });
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timestamp = now.toISOString();
        const report = {
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
    }
    catch (error) {
        console.error("❌ Failed to save health report:", error);
    }
}
/**
 * Get health report history (last N days)
 */
export async function getHealthReportHistory(days = 7) {
    try {
        await fs.mkdir(REPORTS_DIR, { recursive: true });
        const files = await fs.readdir(REPORTS_DIR);
        const reports = [];
        // Get last N days of reports
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const filename = `health_${dateStr}.json`;
            if (files.includes(filename)) {
                const filepath = path.join(REPORTS_DIR, filename);
                const content = await fs.readFile(filepath, "utf-8");
                reports.push(JSON.parse(content));
            }
        }
        return reports;
    }
    catch (error) {
        console.error("❌ Failed to read health report history:", error);
        return [];
    }
}
/**
 * Generate an embed showing health report history
 */
export async function generateHistoryEmbed(days = 7) {
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
    const lines = [];
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
//# sourceMappingURL=healthCheck.js.map