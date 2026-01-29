import { shellTools, handleShellCommand } from "./shell.js";
import { fileTools, handleFileTool } from "./files.js";
import { searchTools, handleSearchTool } from "./search.js";
import { netlifyTools, handleNetlifyTool } from "./netlify.js";
export const allTools = [
    ...shellTools,
    ...fileTools,
    ...searchTools,
    ...netlifyTools
];
export async function executeToolCall(name, args, context) {
    // Check which handler to use
    if (shellTools.some(t => t.function.name === name)) {
        return handleShellCommand(args, context);
    }
    if (fileTools.some(t => t.function.name === name)) {
        return handleFileTool(name, args);
    }
    if (searchTools.some(t => t.function.name === name)) {
        return handleSearchTool(name, args);
    }
    if (netlifyTools.some(t => t.function.name === name)) {
        return handleNetlifyTool(name, args, context);
    }
    return { error: `Tool ${name} not found` };
}
//# sourceMappingURL=index.js.map