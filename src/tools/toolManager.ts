import { customToolsEngine } from "../core/CustomToolsEngine.js";
import { permissionManager } from "../core/PermissionManager.js";
import type { ToolContext } from "../types/toolContext.js";

export const toolManagerTools = [
    {
        type: "function",
        function: {
            name: "register_custom_tool",
            description: "Register a new custom Javascript tool. Only permitted users/admins can run this tool.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The snake_case name of the tool (e.g., fetch_json_data)" },
                    description: { type: "string", description: "Clear explanation of what the tool does" },
                    parameters: {
                        type: "array",
                        description: "Parameters definition for this tool",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "Parameter name (snake_case)" },
                                type: { type: "string", enum: ["string", "number", "boolean"], description: "Data type" },
                                description: { type: "string", description: "Explanation of the parameter" },
                                required: { type: "boolean", description: "Is this parameter required?" }
                            },
                            required: ["name", "type", "description", "required"]
                        }
                    },
                    code: { type: "string", description: "The Javascript execution script. Write async code, set the final output to the `result` variable. Direct console logs are collected." }
                },
                required: ["name", "description", "parameters", "code"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_custom_tool",
            description: "Update an existing custom Javascript tool. Only permitted users/admins can run this tool.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The snake_case name of the tool to update" },
                    description: { type: "string", description: "New description (optional)" },
                    parameters: {
                        type: "array",
                        description: "New parameters (optional)",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                type: { type: "string", enum: ["string", "number", "boolean"] },
                                description: { type: "string" },
                                required: { type: "boolean" }
                            },
                            required: ["name", "type", "description", "required"]
                        }
                    },
                    code: { type: "string", description: "New Javascript code execution script (optional)" }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_custom_tool",
            description: "Delete an existing custom Javascript tool. Only permitted users/admins can run this tool.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The name of the custom tool to delete" }
                },
                required: ["name"]
            }
        }
    }
];

export async function handleToolManagerCall(name: string, args: any, context?: ToolContext) {
    // 1. Verify Permission
    const userId = context?.userId || "desktop-admin";
    if (userId !== "desktop-admin" && !permissionManager.canManageTools(userId)) {
        return { error: `Access Denied: User "${userId}" does not have permission to manage custom tools.` };
    }

    try {
        if (name === "register_custom_tool") {
            const tool = customToolsEngine.create({
                name: args.name,
                description: args.description,
                parameters: args.parameters,
                code: args.code,
            });
            console.log(`🤖 Registered custom tool: ${args.name}`);
            return { success: true, message: `Successfully registered new custom tool "${args.name}".`, tool };
        }

        if (name === "update_custom_tool") {
            const updates: any = {};
            if (args.description !== undefined) updates.description = args.description;
            if (args.parameters !== undefined) updates.parameters = args.parameters;
            if (args.code !== undefined) updates.code = args.code;

            const tool = customToolsEngine.updateByName(args.name, updates);
            console.log(`🤖 Updated custom tool: ${args.name}`);
            return { success: true, message: `Successfully updated custom tool "${args.name}".`, tool };
        }

        if (name === "delete_custom_tool") {
            customToolsEngine.deleteByName(args.name);
            console.log(`🤖 Deleted custom tool: ${args.name}`);
            return { success: true, message: `Successfully deleted custom tool "${args.name}".` };
        }

        return { error: `Unknown tool manager action: ${name}` };
    } catch (e: any) {
        return { error: e.message || String(e) };
    }
}
