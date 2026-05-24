import { simpleGit } from "simple-git";
import type { SimpleGit, SimpleGitOptions } from "simple-git";
import * as fs from "fs";
import * as path from "path";
import { workspaceStore } from "../core/WorkspaceStore.js";
import type { ToolContext } from "../types/toolContext.js";

export const gitTools = [
    {
        type: "function",
        function: {
            name: "git_clone",
            description: "Clone a remote Git repository into the active workspace.",
            parameters: {
                type: "object",
                properties: {
                    repo_url: { type: "string", description: "The Git clone URL (HTTPS/SSH)" },
                    dir_name: { type: "string", description: "Optional folder name to clone into (resolves inside workspace)" }
                },
                required: ["repo_url"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_status",
            description: "Check the Git status of the workspace (modified files, staged files, active branch).",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_add",
            description: "Stage changes in the workspace.",
            parameters: {
                type: "object",
                properties: {
                    files: { type: "array", items: { type: "string" }, description: "Specific files or glob pattern (default: all files)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_commit",
            description: "Commit staged changes in the workspace.",
            parameters: {
                type: "object",
                properties: {
                    message: { type: "string", description: "Commit message" }
                },
                required: ["message"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_push",
            description: "Push local commits to a remote Git repository.",
            parameters: {
                type: "object",
                properties: {
                    remote: { type: "string", description: "Remote repository name (default: origin)" },
                    branch: { type: "string", description: "Branch name (default: current branch)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_pull",
            description: "Pull updates from a remote Git repository.",
            parameters: {
                type: "object",
                properties: {
                    remote: { type: "string", description: "Remote repository name (default: origin)" },
                    branch: { type: "string", description: "Branch name (default: current branch)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_branch",
            description: "List, create, switch, or delete branches.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["list", "create", "switch", "delete"], description: "Branch action to perform" },
                    name: { type: "string", description: "Branch name (required for create, switch, delete)" }
                },
                required: ["action"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_diff",
            description: "Show unstaged modifications in the workspace.",
            parameters: {
                type: "object",
                properties: {
                    file: { type: "string", description: "Optional specific file to check diff for" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "git_log",
            description: "View Git commit history log.",
            parameters: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "Maximum number of commits to return (default: 10)" }
                }
            }
        }
    }
];

function getGitInstance(baseDir: string): SimpleGit {
    const options: Partial<SimpleGitOptions> = {
        baseDir,
        binary: "git",
        maxConcurrentProcesses: 6,
        trimmed: false,
    };
    return simpleGit(options);
}

export async function handleGitTool(name: string, args: any, context?: ToolContext) {
    const baseDir = context?.workspaceRoot || workspaceStore.getActivePath() || process.cwd();

    // Ensure the base directory exists
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    const git = getGitInstance(baseDir);

    try {
        if (name === "git_clone") {
            let targetDir = baseDir;
            if (args.dir_name) {
                targetDir = path.resolve(baseDir, args.dir_name);
                // Security check
                if (context?.workspaceRoot && !targetDir.startsWith(context.workspaceRoot)) {
                    return { error: "Access Denied: Cannot clone repository outside your workspace root." };
                }
            }
            if (context) await context.sendLog(`📥 *Cloning repository: ${args.repo_url} into ${targetDir}...*`);
            await git.clone(args.repo_url, targetDir);
            return { success: true, message: `Successfully cloned repo into: ${targetDir}` };
        }

        // Verify if git repository is initialized (for non-clone actions)
        const isRepo = await git.checkIsRepo();
        if (!isRepo && name !== "git_clone") {
            return { error: `The directory "${baseDir}" is not a Git repository. Run a command to initialize or clone one.` };
        }

        if (name === "git_status") {
            const status = await git.status();
            return {
                branch: status.current,
                tracking: status.tracking,
                isClean: status.isClean(),
                modified: status.modified,
                created: status.created,
                deleted: status.deleted,
                not_added: status.not_added,
                staged: status.staged,
                ahead: status.ahead,
                behind: status.behind,
            };
        }

        if (name === "git_add") {
            const targets = args.files && args.files.length > 0 ? args.files : ".";
            // Secure all targets
            if (context?.workspaceRoot && Array.isArray(args.files)) {
                for (const f of args.files) {
                    const resolved = path.resolve(baseDir, f);
                    if (!resolved.startsWith(context.workspaceRoot)) {
                        return { error: `Access Denied: Staged target "${f}" escapes workspace root.` };
                    }
                }
            }
            await git.add(targets);
            return { success: true, message: `Successfully staged changes for: ${JSON.stringify(targets)}` };
        }

        if (name === "git_commit") {
            const result = await git.commit(args.message);
            return {
                success: true,
                message: `Successfully committed staged changes.`,
                commitId: result.commit,
                summary: result.summary,
            };
        }

        if (name === "git_push") {
            const remote = args.remote || "origin";
            const currentBranch = (await git.status()).current;
            const branch = args.branch || currentBranch;
            if (!branch) return { error: "No active branch found to push." };

            if (context) await context.sendLog(`📤 *Pushing local changes to ${remote}/${branch}...*`);
            await git.push(remote, branch);
            return { success: true, message: `Successfully pushed code to ${remote}/${branch}.` };
        }

        if (name === "git_pull") {
            const remote = args.remote || "origin";
            const currentBranch = (await git.status()).current;
            const branch = args.branch || currentBranch;
            if (!branch) return { error: "No active branch found to pull." };

            if (context) await context.sendLog(`📥 *Pulling changes from ${remote}/${branch}...*`);
            const pullResult = await git.pull(remote, branch);
            return {
                success: true,
                message: `Successfully pulled latest changes.`,
                summary: pullResult.summary,
                files: pullResult.files,
            };
        }

        if (name === "git_branch") {
            const action = args.action;
            const branchName = args.name;

            if (action === "list") {
                const summary = await git.branch();
                return {
                    current: summary.current,
                    branches: summary.all,
                };
            }

            if (!branchName) {
                return { error: `Branch name is required for action: ${action}` };
            }

            if (action === "create") {
                await git.checkoutLocalBranch(branchName);
                return { success: true, message: `Created and checked out local branch "${branchName}".` };
            }

            if (action === "switch") {
                await git.checkout(branchName);
                return { success: true, message: `Switched checkout to branch "${branchName}".` };
            }

            if (action === "delete") {
                await git.deleteLocalBranch(branchName);
                return { success: true, message: `Deleted local branch "${branchName}".` };
            }
        }

        if (name === "git_diff") {
            const diffArgs = args.file ? [args.file] : [];
            if (args.file && context?.workspaceRoot) {
                const resolved = path.resolve(baseDir, args.file);
                if (!resolved.startsWith(context.workspaceRoot)) {
                    return { error: "Access Denied: Cannot view diff for files outside your workspace." };
                }
            }
            const diffText = await git.diff(diffArgs);
            return { diff: diffText || "No changes detected." };
        }

        if (name === "git_log") {
            const limit = args.limit || 10;
            const logSummary = await git.log({ maxCount: limit });
            return {
                latest: logSummary.latest,
                commits: logSummary.all.map((c) => ({
                    hash: c.hash,
                    date: c.date,
                    message: c.message,
                    author: c.author_name,
                })),
            };
        }

        return { error: `Unknown Git action: ${name}` };
    } catch (e: any) {
        return { error: e.message || String(e) };
    }
}
