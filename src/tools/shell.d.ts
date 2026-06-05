import type { ToolContext } from "../types/toolContext.js";
export declare const shellTools: {
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
}[];
export declare function handleShellCommand(args: {
    command: string;
}, context?: ToolContext): Promise<unknown>;
//# sourceMappingURL=shell.d.ts.map