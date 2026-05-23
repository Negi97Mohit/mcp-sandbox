import type { ToolContext } from "../types/toolContext.js";
export declare const netlifyMonitorTools: ({
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
})[];
export declare function handleNetlifyMonitorTool(name: string, args: any, context?: ToolContext): Promise<{
    error: string;
    success?: never;
    message?: never;
    siteId?: never;
    siteName?: never;
    repoUrl?: never;
    count?: never;
    sites?: never;
} | {
    success: boolean;
    message: string;
    siteId: any;
    siteName: any;
    repoUrl: any;
    error?: never;
    count?: never;
    sites?: never;
} | {
    message: string;
    error?: never;
    success?: never;
    siteId?: never;
    siteName?: never;
    repoUrl?: never;
    count?: never;
    sites?: never;
} | {
    message: string;
    count: number;
    sites: import("../services/netlifyMonitorStore.js").MonitoredSite[];
    error?: never;
    success?: never;
    siteId?: never;
    siteName?: never;
    repoUrl?: never;
} | {
    success: boolean;
    message: string;
    error?: never;
    siteId?: never;
    siteName?: never;
    repoUrl?: never;
    count?: never;
    sites?: never;
}>;
//# sourceMappingURL=netlifyMonitor.d.ts.map