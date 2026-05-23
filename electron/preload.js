"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    // Config
    getConfig: () => electron_1.ipcRenderer.invoke("config:get"),
    updateConfig: (updates) => electron_1.ipcRenderer.invoke("config:set", updates),
    getAvailableModels: () => electron_1.ipcRenderer.invoke("config:models"),
    // Users & Permissions
    getUsers: () => electron_1.ipcRenderer.invoke("users:list"),
    grantUser: (userId, role) => electron_1.ipcRenderer.invoke("users:grant", userId, role),
    revokeUser: (userId) => electron_1.ipcRenderer.invoke("users:revoke", userId),
    createWorkspace: (userId) => electron_1.ipcRenderer.invoke("users:workspace", userId),
    getUserHistory: (userId) => electron_1.ipcRenderer.invoke("users:history", userId),
    // Health & Stats
    runHealthCheck: () => electron_1.ipcRenderer.invoke("health:check"),
    getHealthHistory: (days) => electron_1.ipcRenderer.invoke("health:history", days),
    getStats: (days) => electron_1.ipcRenderer.invoke("stats:get", days),
    getStatsChartData: (days) => electron_1.ipcRenderer.invoke("stats:charts", days),
    // Platform Adapters
    getPlatforms: () => electron_1.ipcRenderer.invoke("platforms:list"),
    startPlatform: (id) => electron_1.ipcRenderer.invoke("platforms:start", id),
    stopPlatform: (id) => electron_1.ipcRenderer.invoke("platforms:stop", id),
    getPlatformConfig: (id) => electron_1.ipcRenderer.invoke("platforms:config:get", id),
    updatePlatformConfig: (id, config) => electron_1.ipcRenderer.invoke("platforms:config:set", id, config),
    // Agent Chat
    sendChatMessage: (sessionId, message) => electron_1.ipcRenderer.invoke("chat:send", sessionId, message),
    getChatHistory: (sessionId) => electron_1.ipcRenderer.invoke("chat:history", sessionId),
    clearChatHistory: (sessionId) => electron_1.ipcRenderer.invoke("chat:clear", sessionId),
    listSessions: () => electron_1.ipcRenderer.invoke("chat:sessions"),
    onChatStream: (callback) => {
        electron_1.ipcRenderer.on("chat:stream", (_e, data) => callback(data));
    },
    offChatStream: () => {
        electron_1.ipcRenderer.removeAllListeners("chat:stream");
    },
    // Action Logs
    getActions: (filters) => electron_1.ipcRenderer.invoke("actions:list", filters),
    getActionDetail: (id) => electron_1.ipcRenderer.invoke("actions:detail", id),
    // Window Controls (legacy tray)
    minimizeToTray: () => electron_1.ipcRenderer.invoke("window:minimize-tray"),
    getAutoLaunch: () => electron_1.ipcRenderer.invoke("app:auto-launch:get"),
    setAutoLaunch: (enabled) => electron_1.ipcRenderer.invoke("app:auto-launch:set", enabled),
    // Window Controls (frameless)
    minimize: () => electron_1.ipcRenderer.invoke("window:minimize"),
    maximize: () => electron_1.ipcRenderer.invoke("window:maximize"),
    closeWindow: () => electron_1.ipcRenderer.invoke("window:close"),
    isMaximized: () => electron_1.ipcRenderer.invoke("window:is-maximized"),
    onMaximizeChange: (cb) => {
        electron_1.ipcRenderer.on("window:maximize-change", (_e, val) => cb(val));
    },
    // Workspaces
    listWorkspaces: () => electron_1.ipcRenderer.invoke("workspaces:list"),
    createWorkspaceDir: (name, dirPath) => electron_1.ipcRenderer.invoke("workspaces:create", name, dirPath),
    deleteWorkspace: (id) => electron_1.ipcRenderer.invoke("workspaces:delete", id),
    setActiveWorkspace: (id) => electron_1.ipcRenderer.invoke("workspaces:set-active", id),
    getActiveWorkspace: () => electron_1.ipcRenderer.invoke("workspaces:get-active"),
    browseForWorkspace: () => electron_1.ipcRenderer.invoke("workspaces:browse"),
    // Custom Tools
    listCustomTools: () => electron_1.ipcRenderer.invoke("custom-tools:list"),
    createCustomTool: (tool) => electron_1.ipcRenderer.invoke("custom-tools:create", tool),
    updateCustomTool: (id, updates) => electron_1.ipcRenderer.invoke("custom-tools:update", id, updates),
    deleteCustomTool: (id) => electron_1.ipcRenderer.invoke("custom-tools:delete", id),
    runCustomTool: (toolName, args) => electron_1.ipcRenderer.invoke("custom-tools:run", toolName, args),
    // System events
    onBotStatusChange: (cb) => {
        electron_1.ipcRenderer.on("bot:status", (_e, s) => cb(s));
    },
    onServiceLog: (cb) => {
        electron_1.ipcRenderer.on("service:log", (_e, log) => cb(log));
    },
});
//# sourceMappingURL=preload.js.map