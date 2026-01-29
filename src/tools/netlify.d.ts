import type { ToolContext } from "../types/toolContext.js";
export declare const netlifyTools: ({
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
                command: {
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
                prod?: never;
                build?: never;
                message?: never;
                alias?: never;
                dry?: never;
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
})[];
export declare function handleNetlifyTool(name: string, args: any, context?: ToolContext): Promise<unknown>;
//# sourceMappingURL=netlify.d.ts.map