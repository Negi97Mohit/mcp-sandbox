import { ipcMain, BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { customToolsEngine } from "../../src/core/CustomToolsEngine.js";
import { ExplainerAgent } from "../../src/agents/explainerAgent.js";
import { GeneratorAgent } from "../../src/agents/generatorAgent.js";
import { orchestrator } from "../../src/agents/orchestrator.js";

export function registerCustomToolHandlers() {
    ipcMain.handle("custom-tools:list", () => {
        return customToolsEngine.list();
    });

    ipcMain.handle("custom-tools:create", (_event, tool: any) => {
        try {
            const created = customToolsEngine.create(tool);
            return { success: true, tool: created };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("custom-tools:update", (_event, id: string, updates: any) => {
        try {
            const updated = customToolsEngine.update(id, updates);
            return { success: true, tool: updated };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("custom-tools:delete", (_event, id: string) => {
        try {
            customToolsEngine.delete(id);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("custom-tools:run", async (_event, toolName: string, args: any) => {
        return customToolsEngine.run(toolName, args);
    });

    ipcMain.handle("custom-tools:read-source", async (_event, toolName: string, isCustom: boolean) => {
        try {
            if (isCustom) {
                const tool = customToolsEngine.getByName(toolName);
                return { success: true, content: tool ? tool.code : "" };
            } else {
                const fileMap: Record<string, string> = {
                    run_shell: "src/tools/shell.ts",
                    read_file: "src/tools/files.ts",
                    write_file: "src/tools/files.ts",
                    list_files: "src/tools/files.ts",
                    find_git_repos: "src/tools/search.ts",
                    github_list_issues: "src/tools/github.ts",
                    github_get_issue: "src/tools/github.ts",
                    github_create_pr: "src/tools/github.ts",
                    netlify_site_manage: "src/tools/netlify.ts",
                    netlify_monitor_add: "src/tools/netlifyMonitor.ts",
                    netlify_monitor_list: "src/tools/netlifyMonitor.ts",
                    netlify_monitor_remove: "src/tools/netlifyMonitor.ts",
                };
                const relPath = fileMap[toolName];
                if (!relPath) throw new Error(`Unknown built-in tool: ${toolName}`);
                const fullPath = path.resolve(process.cwd(), relPath);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    return { success: true, content, filePath: relPath };
                }
                return { success: false, error: "File not found" };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // AI Tool Assistant: Explain Tool
    ipcMain.handle("custom-tools:ai-explain", async (_event, toolName: string, isCustom: boolean) => {
        try {
            let toolDetail = "";
            if (isCustom) {
                const tool = customToolsEngine.getByName(toolName);
                if (!tool) throw new Error(`Custom tool "${toolName}" not found.`);
                toolDetail = `CUSTOM TOOL JSON:\n${JSON.stringify(tool, null, 2)}`;
            } else {
                // Find path of built-in tool. We can locate its file relative to root
                // Built-in tools are run_shell, read_file, etc.
                const fileMap: Record<string, string> = {
                    run_shell: "src/tools/shell.ts",
                    read_file: "src/tools/files.ts",
                    write_file: "src/tools/files.ts",
                    list_files: "src/tools/files.ts",
                    find_git_repos: "src/tools/search.ts",
                    github_list_issues: "src/tools/github.ts",
                    github_get_issue: "src/tools/github.ts",
                    github_create_pr: "src/tools/github.ts",
                    netlify_site_manage: "src/tools/netlify.ts",
                    netlify_monitor_add: "src/tools/netlifyMonitor.ts",
                    netlify_monitor_list: "src/tools/netlifyMonitor.ts",
                    netlify_monitor_remove: "src/tools/netlifyMonitor.ts",
                };
                const relPath = fileMap[toolName];
                if (!relPath) throw new Error(`Unknown built-in tool: ${toolName}`);
                const fullPath = path.resolve(process.cwd(), relPath);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    toolDetail = `BUILT-IN TOOL FILE (${relPath}):\n${content}`;
                } else {
                    toolDetail = `BUILT-IN TOOL NAME: ${toolName} (Source file missing at ${relPath})`;
                }
            }

            const agent = new ExplainerAgent();
            const result = await agent.run({
                taskId: `explain-${toolName}-${Date.now()}`,
                request: `Explain the tool named: "${toolName}". Here is its codebase/structure:\n\n${toolDetail}`,
                subTask: { id: `explain-${toolName}-subtask`, type: "review", description: `Explain ${toolName} tool` },
                history: [],
                context: {
                    channelId: "desktop-explain",
                    userId: "desktop-admin",
                    sendLog: async () => {},
                    workspaceRoot: process.cwd()
                }
            });

            if (!result.success) {
                return { success: false, error: result.error || "Failed to explain tool" };
            }
            return { success: true, explanation: result.output };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // AI Tool Assistant: Generate Custom Tool
    ipcMain.handle("custom-tools:ai-generate-custom", async (_event, details: any) => {
        try {
            const prompt = `Create a custom tool based on:
Tool Name Proposal: ${details.name || "generate_custom_tool"}
Purpose/Instructions: ${details.prompt}
Parameters Required: ${JSON.stringify(details.parameters || [])}
External API URL Details: ${details.apiUrl || "None"}
Expected Output Format: ${details.expectedOutput || "Any response"}
`;

            const agent = new GeneratorAgent();
            const result = await agent.run({
                taskId: `generate-tool-${Date.now()}`,
                request: prompt,
                subTask: { id: `generate-tool-subtask`, type: "implement", description: "Generate custom tool" },
                history: [],
                context: {
                    channelId: "desktop-generate",
                    userId: "desktop-admin",
                    sendLog: async () => {},
                    workspaceRoot: process.cwd()
                }
            });

            if (!result.success) {
                return { success: false, error: result.error || "Failed to generate tool code" };
            }

            // Extract JSON object from AI response
            try {
                const cleanJSON = result.output
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();
                const parsed = JSON.parse(cleanJSON);
                return { success: true, tool: parsed };
            } catch (err: any) {
                return { 
                    success: false, 
                    error: `AI generated output that could not be parsed as JSON: ${err.message}.\n\nAI Output:\n${result.output}` 
                };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // AI Tool Assistant: Modify Built-in Tool via Orchestrator
    ipcMain.handle("custom-tools:ai-modify-builtin", async (event, toolName: string, prompt: string) => {
        try {
            const fileMap: Record<string, string> = {
                run_shell: "src/tools/shell.ts",
                read_file: "src/tools/files.ts",
                write_file: "src/tools/files.ts",
                list_files: "src/tools/files.ts",
                find_git_repos: "src/tools/search.ts",
                github_list_issues: "src/tools/github.ts",
                github_get_issue: "src/tools/github.ts",
                github_create_pr: "src/tools/github.ts",
                netlify_site_manage: "src/tools/netlify.ts",
                netlify_monitor_add: "src/tools/netlifyMonitor.ts",
                netlify_monitor_list: "src/tools/netlifyMonitor.ts",
                netlify_monitor_remove: "src/tools/netlifyMonitor.ts",
            };
            const relPath = fileMap[toolName];
            if (!relPath) throw new Error(`Unknown built-in tool: ${toolName}`);

            const win = BrowserWindow.fromWebContents(event.sender);
            const sendLog = async (text: string) => {
                if (win) {
                    win.webContents.send("custom-tools:ai-modify-log", text);
                }
            };

            await sendLog(`🚀 **Orchestrator** starting to modify built-in tool: \`${toolName}\`...\n`);

            const orchestratorRequest = `Modify the built-in tool ${toolName} implementation inside the file "${relPath}" to: ${prompt}.
Ensure the codebase remains strictly type-safe and builds successfully. Do not delete other tools in the same file.`;

            const result = await orchestrator.run(orchestratorRequest, {
                channelId: "desktop-modify-builtin",
                userId: "desktop-admin",
                sendLog,
                workspaceRoot: process.cwd(),
            });

            const action = result.decision.action;
            if (action === "escalate" || action === "abort") {
                const reason = (result.decision as any).reason || "Orchestrator run failed or escalated.";
                return { success: false, error: reason };
            }

            return { success: true, decision: result.decision };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // AI Tool Assistant: Get Git Diff for tool file
    ipcMain.handle("custom-tools:git-diff", (_event, filePath: string) => {
        try {
            const cleanPath = path.normalize(filePath).replace(/[&;|`$]/g, "");
            const output = execSync(`git diff --color=never -- ${cleanPath}`, { cwd: process.cwd() }).toString();
            return { success: true, diff: output || "No changes detected (clean file)." };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // AI Tool Assistant: Discard Git changes for tool file
    ipcMain.handle("custom-tools:git-discard", (_event, filePath: string) => {
        try {
            const cleanPath = path.normalize(filePath).replace(/[&;|`$]/g, "");
            execSync(`git checkout -- ${cleanPath}`, { cwd: process.cwd() });
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });
}
