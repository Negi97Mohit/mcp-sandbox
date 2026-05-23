import { ipcMain } from "electron";
import { generateHealthReport, getHealthReportHistory } from "../../src/health/healthCheck.js";
import { getStatsHistory, getToolUsageBreakdown } from "../../src/health/statsTracker.js";

export function registerHealthHandlers() {
    ipcMain.handle("health:check", async (_event, force?: boolean) => {
        const { overallStatus } = await generateHealthReport(force);
        // Read the saved health file directly or return a standard response structure
        const history = await getHealthReportHistory(1);
        if (history[0]) {
            return history[0];
        }
        return {
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split("T")[0],
            overallStatus,
            checks: []
        };
    });

    ipcMain.handle("health:history", async (_event, days: number) => {
        return await getHealthReportHistory(days || 7);
    });

    ipcMain.handle("stats:get", async (_event, days: number) => {
        return await getStatsHistory(days || 7);
    });

    ipcMain.handle("stats:charts", async (_event, days: number) => {
        const d = days || 7;
        const history = await getStatsHistory(d);
        const breakdown = await getToolUsageBreakdown(d);

        // Map breakdown to Recharts pie format
        const pieData = Object.entries(breakdown).map(([name, value]) => ({
            name,
            value,
        }));

        // Map history to Recharts line format
        const lineData = history.map(h => ({
            date: h.date,
            messages: h.messagesProcessed,
            tools: h.totalToolCalls,
            errors: h.errors,
            responseTime: h.avgResponseTime,
        }));

        return {
            pieData,
            lineData,
        };
    });
}
