import type { ToolContext } from "../types/toolContext.js";
export declare const toolManagerTools: ({
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                name: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                parameters: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                                description: string;
                            };
                            type: {
                                type: string;
                                enum: string[];
                                description: string;
                            };
                            description: {
                                type: string;
                                description: string;
                            };
                            required: {
                                type: string;
                                description: string;
                            };
                        };
                        required: string[];
                    };
                };
                code: {
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
                name: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                parameters: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                                description?: never;
                            };
                            type: {
                                type: string;
                                enum: string[];
                                description?: never;
                            };
                            description: {
                                type: string;
                                description?: never;
                            };
                            required: {
                                type: string;
                                description?: never;
                            };
                        };
                        required: string[];
                    };
                };
                code: {
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
                name: {
                    type: string;
                    description: string;
                };
                description?: never;
                parameters?: never;
                code?: never;
            };
            required: string[];
        };
    };
})[];
export declare function handleToolManagerCall(name: string, args: any, context?: ToolContext): Promise<{
    success: boolean;
    message: string;
    tool: import("../core/CustomToolsEngine.js").CustomTool;
    error?: never;
} | {
    success: boolean;
    message: string;
    tool?: never;
    error?: never;
} | {
    error: any;
    success?: never;
    message?: never;
    tool?: never;
}>;
//# sourceMappingURL=toolManager.d.ts.map