import { shellTools, handleShellCommand } from "./shell.js";
import { fileTools, handleFileTool } from "./files.js";
import { searchTools, handleSearchTool } from "./search.js";
import { netlifyTools, handleNetlifyTool } from "./netlify.js";
import { netlifyMonitorTools, handleNetlifyMonitorTool } from "./netlifyMonitor.js";
import type { ToolContext } from "../types/toolContext.js";

export const allTools = [
    ...shellTools,
    ...fileTools,
    ...searchTools,
    ...netlifyTools,
    ...netlifyMonitorTools
];

export async function executeToolCall(name: string, args: any, context?: ToolContext) {
    // Check which handler to use
    if (shellTools.some(t => t.function.name === name)) {
        return handleShellCommand(args, context);
    }
    if (fileTools.some(t => t.function.name === name)) {
        return handleFileTool(name, args, context);
    }
    if (searchTools.some(t => t.function.name === name)) {
        return handleSearchTool(name, args);
    }
    if (netlifyTools.some(t => t.function.name === name)) {
        return handleNetlifyTool(name, args, context);
    }
    if (netlifyMonitorTools.some(t => t.function.name === name)) {
        return handleNetlifyMonitorTool(name, args, context);
    }
    return { error: `Tool ${name} not found` };
}
