import type { ToolContext } from "../types/toolContext.js";
export declare const allTools: ({
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                command: {
                    type: string;
                    description: string;
                };
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
                path: {
                    type: string;
                    description?: never;
                };
                content: {
                    type: string;
                };
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
                path: {
                    type: string;
                    description?: never;
                };
                content?: never;
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
                path: {
                    type: string;
                    description: string;
                };
                content?: never;
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
                start_path: {
                    type: string;
                    description: string;
                };
                max_depth: {
                    type: string;
                    description: string;
                };
            };
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
                key: {
                    type: string;
                    description: string;
                };
                value: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                file: {
                    type: string;
                    description: string;
                };
                name?: never;
                args?: never;
                siteName?: never;
                manual?: never;
                prod?: never;
                build?: never;
                message?: never;
                alias?: never;
                dry?: never;
                command?: never;
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
                action: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                name: {
                    type: string;
                    description: string;
                };
                args: {
                    type: string;
                    description: string;
                };
                key?: never;
                value?: never;
                context?: never;
                file?: never;
                siteName?: never;
                manual?: never;
                prod?: never;
                build?: never;
                message?: never;
                alias?: never;
                dry?: never;
                command?: never;
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
                action: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                siteName: {
                    type: string;
                    description: string;
                };
                manual: {
                    type: string;
                    description: string;
                };
                key?: never;
                value?: never;
                context?: never;
                file?: never;
                name?: never;
                args?: never;
                prod?: never;
                build?: never;
                message?: never;
                alias?: never;
                dry?: never;
                command?: never;
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
                prod: {
                    type: string;
                    description: string;
                };
                build: {
                    type: string;
                    description: string;
                };
                message: {
                    type: string;
                    description: string;
                };
                alias: {
                    type: string;
                    description: string;
                };
                action?: never;
                key?: never;
                value?: never;
                context?: never;
                file?: never;
                name?: never;
                args?: never;
                siteName?: never;
                manual?: never;
                dry?: never;
                command?: never;
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
                dry: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                action?: never;
                key?: never;
                value?: never;
                file?: never;
                name?: never;
                args?: never;
                siteName?: never;
                manual?: never;
                prod?: never;
                build?: never;
                message?: never;
                alias?: never;
                command?: never;
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
                args: {
                    type: string;
                    description: string;
                };
                action?: never;
                key?: never;
                value?: never;
                context?: never;
                file?: never;
                name?: never;
                siteName?: never;
                manual?: never;
                prod?: never;
                build?: never;
                message?: never;
                alias?: never;
                dry?: never;
                command?: never;
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
                target: {
                    type: string;
                    description: string;
                };
                siteIdOrName?: never;
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
                target?: never;
                siteIdOrName?: never;
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
                siteIdOrName: {
                    type: string;
                    description: string;
                };
                target?: never;
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
export declare function executeToolCall(name: string, args: any, context?: ToolContext): Promise<unknown>;
//# sourceMappingURL=index.d.ts.map