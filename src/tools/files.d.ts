import type { ToolContext } from "../types/toolContext.js";
export declare const fileTools: ({
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
})[];
export declare function handleFileTool(name: string, args: any, context?: ToolContext): Promise<{
    success: boolean;
    path: string;
    content?: never;
    files?: never;
    error?: never;
} | {
    content: string;
    success?: never;
    path?: never;
    files?: never;
    error?: never;
} | {
    files: string[];
    path: string;
    success?: never;
    content?: never;
    error?: never;
} | {
    error: any;
    success?: never;
    path?: never;
    content?: never;
    files?: never;
}>;
//# sourceMappingURL=files.d.ts.map