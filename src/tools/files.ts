import * as fs from "fs";
import * as path from "path";

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

// Helper to ensure we aren't unexpectedly relative if not desired, 
// though for "full system access" we just trust the input or resolve from CWD.
function resolvePath(p: string): string {
    if (path.isAbsolute(p)) return p;
    return path.resolve(process.cwd(), p);
}

export async function handleFileTool(name: string, args: any) {
    try {
        if (name === "write_file") {
            const p = resolvePath(args.path);
            fs.mkdirSync(path.dirname(p), { recursive: true });
            fs.writeFileSync(p, args.content);
            console.log(`✍️ Wrote file: ${p}`);
            return { success: true, path: p };
        }

        if (name === "read_file") {
            const p = resolvePath(args.path);
            console.log(`📖 Reading file: ${p}`);
            if (!fs.existsSync(p)) return { error: "File not found" };
            const content = fs.readFileSync(p, "utf-8");
            return { content };
        }

        if (name === "list_files") {
            const p = args.path ? resolvePath(args.path) : process.cwd();
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
