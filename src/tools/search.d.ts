export declare const searchTools: {
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
}[];
export declare function handleSearchTool(name: string, args: any): Promise<{
    repositories: string[];
    error?: never;
} | {
    error: string;
    repositories?: never;
}>;
//# sourceMappingURL=search.d.ts.map