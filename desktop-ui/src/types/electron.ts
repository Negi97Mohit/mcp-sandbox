export interface ElectronAPI {
    getConfig: () => Promise<any>;
    updateConfig: (updates: any) => Promise<any>;
    getAvailableModels: () => Promise<any>;

    getUsers: () => Promise<any>;
    grantUser: (userId: string, role: string, workspaceId?: string, canManageTools?: boolean) => Promise<any>;
    revokeUser: (userId: string) => Promise<any>;
    createWorkspace: (userId: string) => Promise<any>;
    getUserHistory: (userId: string) => Promise<any>;

    runHealthCheck: (force?: boolean) => Promise<any>;
    getHealthHistory: (days: number) => Promise<any>;
    getStats: (days: number) => Promise<any>;
    getStatsChartData: (days: number) => Promise<any>;
    getSystemStats: () => Promise<any>;

    getPlatforms: () => Promise<any>;
    startPlatform: (id: string) => Promise<any>;
    stopPlatform: (id: string) => Promise<any>;
    getPlatformConfig: (id: string) => Promise<any>;
    updatePlatformConfig: (id: string, config: any) => Promise<any>;

    sendChatMessage: (sessionId: string, message: string) => Promise<any>;
    getChatHistory: (sessionId: string) => Promise<any>;
    clearChatHistory: (sessionId: string) => Promise<any>;
    listSessions: () => Promise<any>;
    onChatStream: (callback: (data: any) => void) => void;
    offChatStream: () => void;

    getActions: (filters: any) => Promise<any>;
    getActionDetail: (id: string) => Promise<any>;

    minimizeToTray: () => Promise<any>;
    getAutoLaunch: () => Promise<any>;
    setAutoLaunch: (enabled: boolean) => Promise<any>;

    // Frameless window controls
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    closeWindow: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    onMaximizeChange: (cb: (isMaximized: boolean) => void) => void;

    // Workspaces
    listWorkspaces: () => Promise<any[]>;
    createWorkspaceDir: (name: string, dirPath: string) => Promise<any>;
    deleteWorkspace: (id: string) => Promise<any>;
    setActiveWorkspace: (id: string) => Promise<any>;
    getActiveWorkspace: () => Promise<any>;
    browseForWorkspace: () => Promise<string | null>;

    // Custom Tools
    listCustomTools: () => Promise<any[]>;
    createCustomTool: (tool: any) => Promise<any>;
    updateCustomTool: (id: string, updates: any) => Promise<any>;
    deleteCustomTool: (id: string) => Promise<any>;
    runCustomTool: (toolName: string, args: any) => Promise<any>;

    // AI Tool Assistant & Multi-agent modifications
    aiExplainTool: (toolName: string, isCustom: boolean) => Promise<any>;
    readToolSource: (toolName: string, isCustom: boolean) => Promise<any>;
    aiGenerateCustomTool: (details: any) => Promise<any>;
    aiModifyBuiltinTool: (toolName: string, prompt: string) => Promise<any>;
    getGitDiff: (filePath: string) => Promise<any>;
    discardGitChanges: (filePath: string) => Promise<any>;
    onAiModifyLog: (cb: (text: string) => void) => void;
    offAiModifyLog: () => void;
    onBotStatusChange: (cb: (status: string) => void) => void;
    onServiceLog: (cb: (log: string) => void) => void;
}

declare global {
    interface Window {
        api: ElectronAPI;
    }
}
