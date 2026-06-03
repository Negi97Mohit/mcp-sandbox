"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthHandlers = registerHealthHandlers;
const electron_1 = require("electron");
const healthCheck_js_1 = require("../../src/health/healthCheck.js");
const statsTracker_js_1 = require("../../src/health/statsTracker.js");
function registerHealthHandlers() {
    electron_1.ipcMain.handle("health:check", async () => {
        const { overallStatus } = await (0, healthCheck_js_1.generateHealthReport)();
        // Read the saved health file directly or return a standard response structure
        const history = await (0, healthCheck_js_1.getHealthReportHistory)(1);
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
    electron_1.ipcMain.handle("health:history", async (_event, days) => {
        return await (0, healthCheck_js_1.getHealthReportHistory)(days || 7);
    });
    electron_1.ipcMain.handle("stats:get", async (_event, days) => {
        return await (0, statsTracker_js_1.getStatsHistory)(days || 7);
    });
    electron_1.ipcMain.handle("stats:charts", async (_event, days) => {
        const d = days || 7;
        const history = await (0, statsTracker_js_1.getStatsHistory)(d);
        const breakdown = await (0, statsTracker_js_1.getToolUsageBreakdown)(d);
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
//# sourceMappingURL=healthHandlers.js.map