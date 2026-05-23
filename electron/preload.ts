import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    // Config
    getConfig: () => ipcRenderer.invoke("config:get"),
    updateConfig: (updates: any) => ipcRenderer.invoke("config:set", updates),
    getAvailableModels: () => ipcRenderer.invoke("config:models"),

    // Users & Permissions
    getUsers: () => ipcRenderer.invoke("users:list"),
    grantUser: (userId: string, role: string) => ipcRenderer.invoke("users:grant", userId, role),
    revokeUser: (userId: string) => ipcRenderer.invoke("users:revoke", userId),
    createWorkspace: (userId: string) => ipcRenderer.invoke("users:workspace", userId),
    getUserHistory: (userId: string) => ipcRenderer.invoke("users:history", userId),

    // Health & Stats
    runHealthCheck: (force?: boolean) => ipcRenderer.invoke("health:check", force),
    getHealthHistory: (days: number) => ipcRenderer.invoke("health:history", days),
    getStats: (days: number) => ipcRenderer.invoke("stats:get", days),
    getStatsChartData: (days: number) => ipcRenderer.invoke("stats:charts", days),

    // Platform Adapters
    getPlatforms: () => ipcRenderer.invoke("platforms:list"),
    startPlatform: (id: string) => ipcRenderer.invoke("platforms:start", id),
    stopPlatform: (id: string) => ipcRenderer.invoke("platforms:stop", id),
    getPlatformConfig: (id: string) => ipcRenderer.invoke("platforms:config:get", id),
    updatePlatformConfig: (id: string, config: any) => ipcRenderer.invoke("platforms:config:set", id, config),

    // Agent Chat
    sendChatMessage: (sessionId: string, message: string) => ipcRenderer.invoke("chat:send", sessionId, message),
    getChatHistory: (sessionId: string) => ipcRenderer.invoke("chat:history", sessionId),
    clearChatHistory: (sessionId: string) => ipcRenderer.invoke("chat:clear", sessionId),
    listSessions: () => ipcRenderer.invoke("chat:sessions"),
    onChatStream: (callback: (data: any) => void) => {
        ipcRenderer.on("chat:stream", (_e, data) => callback(data));
    },
    offChatStream: () => {
        ipcRenderer.removeAllListeners("chat:stream");
    },

    // Action Logs
    getActions: (filters: any) => ipcRenderer.invoke("actions:list", filters),
    getActionDetail: (id: string) => ipcRenderer.invoke("actions:detail", id),

    // Window Controls (legacy tray)
    minimizeToTray: () => ipcRenderer.invoke("window:minimize-tray"),
    getAutoLaunch: () => ipcRenderer.invoke("app:auto-launch:get"),
    setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke("app:auto-launch:set", enabled),

    // Window Controls (frameless)
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    closeWindow: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
    onMaximizeChange: (cb: (isMaximized: boolean) => void) => {
        ipcRenderer.on("window:maximize-change", (_e, val) => cb(val));
    },

    // Workspaces
    listWorkspaces: () => ipcRenderer.invoke("workspaces:list"),
    createWorkspaceDir: (name: string, dirPath: string) => ipcRenderer.invoke("workspaces:create", name, dirPath),
    deleteWorkspace: (id: string) => ipcRenderer.invoke("workspaces:delete", id),
    setActiveWorkspace: (id: string) => ipcRenderer.invoke("workspaces:set-active", id),
    getActiveWorkspace: () => ipcRenderer.invoke("workspaces:get-active"),
    browseForWorkspace: () => ipcRenderer.invoke("workspaces:browse"),

    // Custom Tools
    listCustomTools: () => ipcRenderer.invoke("custom-tools:list"),
    createCustomTool: (tool: any) => ipcRenderer.invoke("custom-tools:create", tool),
    updateCustomTool: (id: string, updates: any) => ipcRenderer.invoke("custom-tools:update", id, updates),
    deleteCustomTool: (id: string) => ipcRenderer.invoke("custom-tools:delete", id),
    runCustomTool: (toolName: string, args: any) => ipcRenderer.invoke("custom-tools:run", toolName, args),

    // System events
    onBotStatusChange: (cb: (status: string) => void) => {
        ipcRenderer.on("bot:status", (_e, s) => cb(s));
    },
    onServiceLog: (cb: (log: string) => void) => {
        ipcRenderer.on("service:log", (_e, log) => cb(log));
    },
});
