import type { ToolContext } from "../types/toolContext.js";
export declare const gitTools: ({
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                repo_url: {
                    type: string;
                    description: string;
                };
                dir_name: {
                    type: string;
                    description: string;
                };
                files?: never;
                message?: never;
                remote?: never;
                branch?: never;
                action?: never;
                name?: never;
                file?: never;
                limit?: never;
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
                repo_url?: never;
                dir_name?: never;
                files?: never;
                message?: never;
                remote?: never;
                branch?: never;
                action?: never;
                name?: never;
                file?: never;
                limit?: never;
            };
            required?: never;
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
                files: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                repo_url?: never;
                dir_name?: never;
                message?: never;
                remote?: never;
                branch?: never;
                action?: never;
                name?: never;
                file?: never;
                limit?: never;
            };
            required?: never;
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
                message: {
                    type: string;
                    description: string;
                };
                repo_url?: never;
                dir_name?: never;
                files?: never;
                remote?: never;
                branch?: never;
                action?: never;
                name?: never;
                file?: never;
                limit?: never;
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
                remote: {
                    type: string;
                    description: string;
                };
                branch: {
                    type: string;
                    description: string;
                };
                repo_url?: never;
                dir_name?: never;
                files?: never;
                message?: never;
                action?: never;
                name?: never;
                file?: never;
                limit?: never;
            };
            required?: never;
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
                action: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                name: {
                    type: string;
                    description: string;
                };
                repo_url?: never;
                dir_name?: never;
                files?: never;
                message?: never;
                remote?: never;
                branch?: never;
                file?: never;
                limit?: never;
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
                file: {
                    type: string;
                    description: string;
                };
                repo_url?: never;
                dir_name?: never;
                files?: never;
                message?: never;
                remote?: never;
                branch?: never;
                action?: never;
                name?: never;
                limit?: never;
            };
            required?: never;
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
                limit: {
                    type: string;
                    description: string;
                };
                repo_url?: never;
                dir_name?: never;
                files?: never;
                message?: never;
                remote?: never;
                branch?: never;
                action?: never;
                name?: never;
                file?: never;
            };
            required?: never;
        };
    };
})[];
export declare function handleGitTool(name: string, args: any, context?: ToolContext): Promise<{
    success: boolean;
    message: string;
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    commitId?: never;
    summary?: never;
    files?: never;
    current?: never;
    branches?: never;
    diff?: never;
    latest?: never;
    commits?: never;
    error?: never;
} | {
    branch: string | null;
    tracking: string | null;
    isClean: boolean;
    modified: string[];
    created: string[];
    deleted: string[];
    not_added: string[];
    staged: string[];
    ahead: number;
    behind: number;
    success?: never;
    message?: never;
    commitId?: never;
    summary?: never;
    files?: never;
    current?: never;
    branches?: never;
    diff?: never;
    latest?: never;
    commits?: never;
    error?: never;
} | {
    success: boolean;
    message: string;
    commitId: string;
    summary: {
        changes: number;
        insertions: number;
        deletions: number;
    };
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    files?: never;
    current?: never;
    branches?: never;
    diff?: never;
    latest?: never;
    commits?: never;
    error?: never;
} | {
    success: boolean;
    message: string;
    summary: import("simple-git").PullDetailSummary;
    files: string[];
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    commitId?: never;
    current?: never;
    branches?: never;
    diff?: never;
    latest?: never;
    commits?: never;
    error?: never;
} | {
    current: string;
    branches: string[];
    success?: never;
    message?: never;
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    commitId?: never;
    summary?: never;
    files?: never;
    diff?: never;
    latest?: never;
    commits?: never;
    error?: never;
} | {
    diff: string;
    success?: never;
    message?: never;
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    commitId?: never;
    summary?: never;
    files?: never;
    current?: never;
    branches?: never;
    latest?: never;
    commits?: never;
    error?: never;
} | {
    latest: (import("simple-git").DefaultLogFields & import("simple-git").ListLogLine) | null;
    commits: {
        hash: string;
        date: string;
        message: string;
        author: string;
    }[];
    success?: never;
    message?: never;
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    commitId?: never;
    summary?: never;
    files?: never;
    current?: never;
    branches?: never;
    diff?: never;
    error?: never;
} | {
    error: any;
    success?: never;
    message?: never;
    branch?: never;
    tracking?: never;
    isClean?: never;
    modified?: never;
    created?: never;
    deleted?: never;
    not_added?: never;
    staged?: never;
    ahead?: never;
    behind?: never;
    commitId?: never;
    summary?: never;
    files?: never;
    current?: never;
    branches?: never;
    diff?: never;
    latest?: never;
    commits?: never;
}>;
//# sourceMappingURL=git.d.ts.map