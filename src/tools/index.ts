import { shellTools, handleShellCommand } from "./shell.js";
import { fileTools, handleFileTool } from "./files.js";
import { searchTools, handleSearchTool } from "./search.js";
import { netlifyTools, handleNetlifyTool } from "./netlify.js";
import { netlifyMonitorTools, handleNetlifyMonitorTool } from "./netlifyMonitor.js";
import { customToolsEngine } from "../core/CustomToolsEngine.js";
import type { ToolContext } from "../types/toolContext.js";

export const allTools = [
    ...shellTools,
    ...fileTools,
    ...searchTools,
    ...netlifyTools,
    ...netlifyMonitorTools,
];

// Dynamic: includes custom tools registered at runtime
export function getAllTools() {
    return [
        ...allTools,
        ...customToolsEngine.getToolDefinitions(),
    ];
}

export async function executeToolCall(name: string, args: any, context?: ToolContext) {
    if (shellTools.some((t) => t.function.name === name)) {
        return handleShellCommand(args, context);
    }
    if (fileTools.some((t) => t.function.name === name)) {
        return handleFileTool(name, args, context);
    }
    if (searchTools.some((t) => t.function.name === name)) {
        return handleSearchTool(name, args, context);
    }
    if (netlifyTools.some((t) => t.function.name === name)) {
        return handleNetlifyTool(name, args, context);
    }
    if (netlifyMonitorTools.some((t) => t.function.name === name)) {
        return handleNetlifyMonitorTool(name, args, context);
    }
    // Check custom tools dynamically
    const customTool = customToolsEngine.list().find((t) => t.name === name);
    if (customTool) {
        return customToolsEngine.run(name, args);
    }
    return { error: `Tool ${name} not found` };
}
