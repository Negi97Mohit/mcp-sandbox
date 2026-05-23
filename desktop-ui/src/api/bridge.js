import {} from "../types/electron";
const isElectron = typeof window !== "undefined" && window.api !== undefined;
export const api = isElectron
    ? window.api
    : {
        getConfig: async () => ({
            OPENROUTER_API_KEY: "sk-or-mock-key-value",
            DISCORD_TOKEN: "mock-discord-token",
            NETLIFY_TOKEN: "mock-netlify-token",
            ALLOWED_USER_ID: "1234567890123456",
            MODEL_NAME: "nvidia/nemotron-3-nano-30b-a3b:free",
        }),
        updateConfig: async () => ({ success: true }),
        getAvailableModels: async () => [
            { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B (Free)" },
            { id: "meta-llama/llama-3-8b-instruct:free", name: "Llama 3 8B Instruct (Free)" },
            { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B IT (Free)" },
            { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
            { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
        ],
        getUsers: async () => [
            { userId: "1234567890123456", role: "admin", workspacePath: "/workspaces/admin" },
            { userId: "9876543210987654", role: "write", workspacePath: "/workspaces/user1" },
            { userId: "5432109876543210", role: "read", workspacePath: "/workspaces/user2" },
        ],
        grantUser: async () => ({ success: true }),
        revokeUser: async () => ({ success: true }),
        createWorkspace: async (uid) => ({ workspacePath: `/workspaces/${uid}` }),
        getUserHistory: async () => [],
        runHealthCheck: async () => ({
            timestamp: new Date().toISOString(),
            overallStatus: "healthy",
            checks: [
                { name: "API Key", status: "pass", message: "✅ Configured", details: "Key matches sk-or-... format." },
                { name: "Discord", status: "pass", message: "✅ Configured", details: "Token verified." },
                { name: "Model Connectivity", status: "pass", message: "✅ Responding (180ms)", details: "Model: nemotron-3-nano" },
                { name: "Tools", status: "pass", message: "✅ 5 tools registered", details: "write_file, run_shell, etc." },
                { name: "System Info", status: "pass", message: "📊 Active", details: "OS: Windows, Heap: 48MB" }
            ],
        }),
        getHealthHistory: async () => [
            {
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split("T")[0],
                overallStatus: "healthy",
                checks: []
            }
        ],
        getStats: async () => [],
        getStatsChartData: async () => ({
            pieData: [
                { name: "write_file", value: 18 },
                { name: "run_shell", value: 42 },
                { name: "read_file", value: 27 },
                { name: "list_dir", value: 33 },
                { name: "netlify_status", value: 8 },
            ],
            lineData: [
                { date: "05-17", messages: 12, tools: 20, errors: 0, responseTime: 310 },
                { date: "05-18", messages: 18, tools: 35, errors: 1, responseTime: 290 },
                { date: "05-19", messages: 24, tools: 48, errors: 0, responseTime: 280 },
                { date: "05-20", messages: 15, tools: 30, errors: 0, responseTime: 250 },
                { date: "05-21", messages: 32, tools: 60, errors: 2, responseTime: 340 },
                { date: "05-22", messages: 45, tools: 85, errors: 0, responseTime: 270 },
                { date: "05-23", messages: 28, tools: 52, errors: 1, responseTime: 300 },
            ],
        }),
        getPlatforms: async () => [
            { id: "discord", name: "Discord", icon: "💬", status: "running", description: "Connects DevOps agent to discord server.", requiredConfigKeys: ["DISCORD_TOKEN"] },
            { id: "slack", name: "Slack", icon: "💻", status: "stopped", description: "Integrates with Slack workspace channels.", requiredConfigKeys: ["SLACK_BOT_TOKEN"] },
            { id: "teams", name: "Microsoft Teams", icon: "👥", status: "stopped", description: "Bridges DevOps tools to Microsoft Teams.", requiredConfigKeys: ["TEAMS_APP_PASSWORD"] },
        ],
        startPlatform: async () => ({ success: true, status: "running" }),
        stopPlatform: async () => ({ success: true, status: "stopped" }),
        getPlatformConfig: async () => ({}),
        updatePlatformConfig: async () => ({ success: true }),
        sendChatMessage: async () => ({ success: true }),
        getChatHistory: async () => [],
        clearChatHistory: async () => ({ success: true }),
        listSessions: async () => [{ id: "default", lastMessage: "Start a conversation" }],
        onChatStream: () => { },
        offChatStream: () => { },
        getActions: async () => [
            {
                id: "act_1",
                timestamp: new Date().toISOString(),
                platform: "discord",
                userId: "1234567890123456",
                toolName: "run_shell",
                arguments: { command: "npm run build" },
                result: { stdout: "Build successful", stderr: "" },
                durationMs: 4200,
                status: "success",
            },
            {
                id: "act_2",
                timestamp: new Date().toISOString(),
                platform: "desktop-ui",
                userId: "desktop-admin",
                toolName: "write_file",
                arguments: { path: "src/utils.ts", content: "export const add = (a, b) => a + b" },
                result: { success: true },
                durationMs: 150,
                status: "success",
            }
        ],
        getActionDetail: async (id) => ({
            id,
            timestamp: new Date().toISOString(),
            platform: "desktop-ui",
            userId: "desktop-admin",
            toolName: "write_file",
            arguments: { path: "src/utils.ts", content: "export const add = (a, b) => a + b" },
            result: { success: true },
            durationMs: 150,
            status: "success",
        }),
        minimizeToTray: async () => ({ success: true }),
        getAutoLaunch: async () => false,
        setAutoLaunch: async () => ({ success: true }),
        // Frameless window controls
        minimize: async () => { },
        maximize: async () => { },
        closeWindow: async () => { },
        isMaximized: async () => false,
        onMaximizeChange: () => { },
        // Workspaces
        listWorkspaces: async () => [
            { id: "ws_1", name: "Main Project", path: "C:\\dev\\my-app", createdAt: new Date().toISOString(), isActive: true },
            { id: "ws_2", name: "Backend API", path: "C:\\dev\\api-server", createdAt: new Date().toISOString(), isActive: false },
        ],
        createWorkspaceDir: async () => ({ success: true, workspace: { id: "ws_new", name: "New", path: "C:\\dev\\new", createdAt: new Date().toISOString(), isActive: false } }),
        deleteWorkspace: async () => ({ success: true }),
        setActiveWorkspace: async () => ({ success: true }),
        getActiveWorkspace: async () => ({ id: "ws_1", name: "Main Project", path: "C:\\dev\\my-app", createdAt: new Date().toISOString(), isActive: true }),
        browseForWorkspace: async () => null,
        // Custom Tools
        listCustomTools: async () => [],
        createCustomTool: async () => ({ success: true, tool: {} }),
        updateCustomTool: async () => ({ success: true, tool: {} }),
        deleteCustomTool: async () => ({ success: true }),
        runCustomTool: async () => ({ success: true, output: "mock result", logs: [] }),
        onBotStatusChange: () => { },
        onServiceLog: () => { },
    };
//# sourceMappingURL=bridge.js.map