import { BaseAdapter, type AdapterConfig, type AdapterUser } from "./BaseAdapter.js";
export declare class DiscordAdapter extends BaseAdapter {
    id: string;
    name: string;
    icon: string;
    description: string;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getConfig(): AdapterConfig;
    setConfig(config: AdapterConfig): Promise<void>;
    getUsers(): AdapterUser[];
    getRequiredConfigKeys(): string[];
}
//# sourceMappingURL=DiscordAdapter.d.ts.map