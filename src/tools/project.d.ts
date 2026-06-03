import type { ToolContext } from "../types/toolContext.js";
export declare const projectTools: ({
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                template: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                dir_name: {
                    type: string;
                    description: string;
                };
                action?: never;
                image_name?: never;
                container_name?: never;
                ports?: never;
                dockerfile_path?: never;
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
                image_name: {
                    type: string;
                    description: string;
                };
                container_name: {
                    type: string;
                    description: string;
                };
                ports: {
                    type: string;
                    description: string;
                };
                dockerfile_path: {
                    type: string;
                    description: string;
                };
                template?: never;
                dir_name?: never;
            };
            required: string[];
        };
    };
})[];
export declare function handleProjectTool(name: string, args: any, context?: ToolContext): Promise<unknown>;
//# sourceMappingURL=project.d.ts.map