/**
 * github.ts (tools) — LLM-facing tool definitions and handlers for GitHub.
 *
 * These tools are registered in the tool registry and exposed to all agents.
 * Each tool maps to a typed GitHub API call via githubClient.
 */
import type { ToolContext } from "../types/toolContext.js";
export declare const githubTools: ({
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description: string;
                };
                repo: {
                    type: string;
                    description: string;
                };
                state: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                issue_number?: never;
                title?: never;
                body?: never;
                head?: never;
                base?: never;
                draft?: never;
                path?: never;
                ref?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                issue_number: {
                    type: string;
                    description: string;
                };
                state?: never;
                title?: never;
                body?: never;
                head?: never;
                base?: never;
                draft?: never;
                path?: never;
                ref?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                title: {
                    type: string;
                    description: string;
                };
                body: {
                    type: string;
                    description: string;
                };
                head: {
                    type: string;
                    description: string;
                };
                base: {
                    type: string;
                    description: string;
                };
                draft: {
                    type: string;
                    description: string;
                };
                state?: never;
                issue_number?: never;
                path?: never;
                ref?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                path: {
                    type: string;
                    description: string;
                };
                ref: {
                    type: string;
                    description: string;
                };
                state?: never;
                issue_number?: never;
                title?: never;
                body?: never;
                head?: never;
                base?: never;
                draft?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                state: {
                    type: string;
                    enum: string[];
                    description?: never;
                };
                issue_number?: never;
                title?: never;
                body?: never;
                head?: never;
                base?: never;
                draft?: never;
                path?: never;
                ref?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                issue_number: {
                    type: string;
                    description?: never;
                };
                body: {
                    type: string;
                    description: string;
                };
                state?: never;
                title?: never;
                head?: never;
                base?: never;
                draft?: never;
                path?: never;
                ref?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                branch_name: {
                    type: string;
                    description: string;
                };
                from_branch: {
                    type: string;
                    description: string;
                };
                state?: never;
                issue_number?: never;
                title?: never;
                body?: never;
                head?: never;
                base?: never;
                draft?: never;
                path?: never;
                ref?: never;
            };
            required: string[];
        };
    };
} | {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                owner: {
                    type: string;
                    description?: never;
                };
                repo: {
                    type: string;
                    description?: never;
                };
                state?: never;
                issue_number?: never;
                title?: never;
                body?: never;
                head?: never;
                base?: never;
                draft?: never;
                path?: never;
                ref?: never;
                branch_name?: never;
                from_branch?: never;
            };
            required: string[];
        };
    };
})[];
export declare function handleGitHubTool(name: string, args: any, _context?: ToolContext): Promise<unknown>;
//# sourceMappingURL=github.d.ts.map