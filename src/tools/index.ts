import { shellTools, handleShellCommand } from "./shell.js";
import { fileTools, handleFileTool } from "./files.js";
import { searchTools, handleSearchTool } from "./search.js";
import { netlifyTools, handleNetlifyTool } from "./netlify.js";
import { netlifyMonitorTools, handleNetlifyMonitorTool } from "./netlifyMonitor.js";
import { toolManagerTools, handleToolManagerCall } from "./toolManager.js";
import { gitTools, handleGitTool } from "./git.js";
import { projectTools, handleProjectTool } from "./project.js";
import { customToolsEngine } from "../core/CustomToolsEngine.js";
import { actionLogger } from "../core/ActionLogger.js";
import type { ToolContext } from "../types/toolContext.js";

export const allTools = [
    ...shellTools,
    ...fileTools,
    ...searchTools,
    ...netlifyTools,
    ...netlifyMonitorTools,
    ...toolManagerTools,
    ...gitTools,
    ...projectTools,
];

// Dynamic: includes custom tools registered at runtime
export function getAllTools() {
    return [
        ...allTools,
        ...customToolsEngine.getToolDefinitions(),
    ];
}

export async function executeToolCall(name: string, args: any, context?: ToolContext) {
    const startTime = Date.now();
    let result: any;
    let status: "success" | "error" = "success";
    let errorMsg: string | undefined;

    try {
        if (shellTools.some((t) => t.function.name === name)) {
            result = await handleShellCommand(args, context);
        } else if (fileTools.some((t) => t.function.name === name)) {
            result = await handleFileTool(name, args, context);
        } else if (searchTools.some((t) => t.function.name === name)) {
            result = await handleSearchTool(name, args, context);
        } else if (netlifyTools.some((t) => t.function.name === name)) {
            result = await handleNetlifyTool(name, args, context);
        } else if (netlifyMonitorTools.some((t) => t.function.name === name)) {
            result = await handleNetlifyMonitorTool(name, args, context);
        } else if (toolManagerTools.some((t) => t.function.name === name)) {
            result = await handleToolManagerCall(name, args, context);
        } else if (gitTools.some((t) => t.function.name === name)) {
            result = await handleGitTool(name, args, context);
        } else if (projectTools.some((t) => t.function.name === name)) {
            result = await handleProjectTool(name, args, context);
        } else {
            // Check custom tools dynamically
            const customTool = customToolsEngine.list().find((t) => t.name === name);
            if (customTool) {
                result = await customToolsEngine.run(name, args);
            } else {
                result = { error: `Tool ${name} not found` };
            }
        }

        if (result && result.error) {
            status = "error";
            errorMsg = String(result.error);
        }
    } catch (e: any) {
        status = "error";
        errorMsg = e.message || String(e);
        result = { error: errorMsg };
    }

    const durationMs = Date.now() - startTime;
    actionLogger.log({
        platform: context?.channelId ? "discord" : "desktop-ui",
        userId: context?.userId || "desktop-admin",
        toolName: name,
        arguments: args || {},
        result: result,
        durationMs,
        status,
        error: errorMsg,
    }).catch((err) => {
        console.error("ActionLogger failed to write entry:", err);
    });

    return result;
}
