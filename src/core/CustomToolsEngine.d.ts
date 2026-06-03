export interface CustomToolParameter {
    name: string;
    type: "string" | "number" | "boolean";
    description: string;
    required: boolean;
}
export interface CustomTool {
    id: string;
    name: string;
    description: string;
    parameters: CustomToolParameter[];
    code: string;
    createdAt: string;
}
declare class CustomToolsEngine {
    private dataPath;
    private tools;
    constructor();
    private load;
    private save;
    list(): CustomTool[];
    create(tool: Omit<CustomTool, "id" | "createdAt">): CustomTool;
    update(id: string, updates: Partial<Omit<CustomTool, "id" | "createdAt">>): CustomTool;
    delete(id: string): void;
    getByName(name: string): CustomTool | undefined;
    updateByName(name: string, updates: Partial<Omit<CustomTool, "id" | "createdAt" | "name">>): CustomTool;
    deleteByName(name: string): void;
    run(toolName: string, args: Record<string, any>): Promise<any>;
    getToolDefinitions(): {
        type: string;
        function: {
            name: string;
            description: string;
            parameters: {
                type: string;
                properties: {
                    [k: string]: {
                        type: "string" | "number" | "boolean";
                        description: string;
                    };
                };
                required: string[];
            };
        };
    }[];
}
export declare const customToolsEngine: CustomToolsEngine;
export {};
//# sourceMappingURL=CustomToolsEngine.d.ts.map