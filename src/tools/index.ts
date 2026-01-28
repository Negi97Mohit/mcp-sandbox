import { shellTools, handleShellCommand } from "./shell.js";
import { fileTools, handleFileTool } from "./files.js";
import { searchTools, handleSearchTool } from "./search.js";

export const allTools = [
    ...shellTools,
    ...fileTools,
    ...searchTools
];

export async function executeToolCall(name: string, args: any) {
    // Check which handler to use
    if (shellTools.some(t => t.function.name === name)) {
        return handleShellCommand(args);
    }
    if (fileTools.some(t => t.function.name === name)) {
        return handleFileTool(name, args);
    }
    if (searchTools.some(t => t.function.name === name)) {
        return handleSearchTool(name, args);
    }
    return { error: `Tool ${name} not found` };
}
