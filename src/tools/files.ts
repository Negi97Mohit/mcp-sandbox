import * as fs from "fs";
import * as path from "path";
import type { ToolContext } from "../types/toolContext.js";

export const fileTools = [
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Write content to a file. Supports absolute paths.",
            parameters: {
                type: "object",
                properties: { path: { type: "string" }, content: { type: "string" } },
                required: ["path", "content"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read content from a file. Supports absolute paths.",
            parameters: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "list_files",
            description: "List files in a directory. Supports absolute paths.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory to list (optional, defaults to current working directory)" }
                }
            },
        },
    },
];

function resolveSecurePath(requestedPath: string, context?: ToolContext): string {
    // 1. If no workspace sandbox, behave normally (Admin mode)
    if (!context?.workspaceRoot) {
        if (path.isAbsolute(requestedPath)) return requestedPath;
        return path.resolve(process.cwd(), requestedPath);
    }

    // 2. Sandbox mode
    const root = context.workspaceRoot;
    // Resolve relative to workspace root (even if absolute path is given, we might want to treat it relative if it's suspicious, but for now let's assume absolute paths are rejected or checked)

    // Better strategy: Treat ALL paths as relative to workspaceRoot for sandboxed users
    // unless they explicitly try to escape.

    const resolved = path.resolve(root, requestedPath);

    if (!resolved.startsWith(root)) {
        throw new Error(`Access Denied: You cannot verify files outside your workspace (${root}).`);
    }

    return resolved;
}

export async function handleFileTool(name: string, args: any, context?: ToolContext) {
    try {
        if (name === "write_file") {
            const p = resolveSecurePath(args.path, context);
            fs.mkdirSync(path.dirname(p), { recursive: true });
            fs.writeFileSync(p, args.content);
            console.log(`✍️ Wrote file: ${p}`);
            return { success: true, path: p };
        }

        if (name === "read_file") {
            const p = resolveSecurePath(args.path, context);
            console.log(`📖 Reading file: ${p}`);
            if (!fs.existsSync(p)) return { error: "File not found" };
            const content = fs.readFileSync(p, "utf-8");
            return { content };
        }

        if (name === "list_files") {
            const target = args.path || "."; // Default to current dir (relative)
            const p = resolveSecurePath(target, context);
            console.log(`📂 Listing files in: ${p}`);
            if (!fs.existsSync(p)) return { error: "Directory not found" };
            const files = fs.readdirSync(p);
            return { files, path: p };
        }

        return { error: "Unknown file tool" };
    } catch (e: any) {
        return { error: e.message };
    }
}
