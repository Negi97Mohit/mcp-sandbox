import * as fs from "fs";
import * as path from "path";
import { workspaceStore } from "../core/WorkspaceStore.js";
import type { ToolContext } from "../types/toolContext.js";

export const searchTools = [
    {
        type: "function",
        function: {
            name: "find_git_repos",
            description: "Search for git repositories in a given directory (recursively).",
            parameters: {
                type: "object",
                properties: {
                    start_path: {
                        type: "string",
                        description: "Path to start searching from (default: User Home)",
                    },
                    max_depth: {
                        type: "number",
                        description: "Maximum depth to search (default: 5)"
                    }
                },
            },
        },
    },
];

export async function handleSearchTool(name: string, args: any, context?: ToolContext) {
    if (name === "find_git_repos") {
        const baseDir = context?.workspaceRoot || workspaceStore.getActivePath() || process.cwd();
        let startPath = args.start_path;
        if (startPath) {
            if (path.isAbsolute(startPath)) {
                if (context?.workspaceRoot && !startPath.startsWith(context.workspaceRoot)) {
                    return { error: `Access Denied: You cannot search outside your workspace.` };
                }
            } else {
                startPath = path.resolve(baseDir, startPath);
            }
        } else {
            startPath = baseDir;
        }

        // Verify startPath starts with workspaceRoot if sandboxed
        if (context?.workspaceRoot && !startPath.startsWith(context.workspaceRoot)) {
            return { error: `Access Denied: You cannot search outside your workspace.` };
        }

        const maxDepth = args.max_depth || 5;
        console.log(`🔎 Searching for Git repos starting at: ${startPath}`);

        const foundRepos: string[] = [];
        const ignoreDirs = new Set(["node_modules", "dist", "build", ".vscode", ".idea", "AppData", "Application Data"]);

        function search(dir: string, depth: number) {
            if (depth > maxDepth) return;
            if (foundRepos.length >= 20) return;

            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });

                // Check if this dir is a git repo
                if (entries.some(e => e.isDirectory() && e.name === ".git")) {
                    foundRepos.push(dir);
                    // Don't search inside a repo unless we want submodules
                    return;
                }

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        if (entry.name.startsWith(".")) continue;
                        if (ignoreDirs.has(entry.name)) continue;

                        search(path.join(dir, entry.name), depth + 1);
                    }
                }
            } catch (e) {
                // Ignore access errors
            }
        }

        search(startPath, 0);
        console.log(`✅ Found ${foundRepos.length} repos.`);
        return { repositories: foundRepos };
    }
    return { error: "Unknown search tool" };
}
