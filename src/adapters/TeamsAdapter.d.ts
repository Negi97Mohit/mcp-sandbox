import { BaseAdapter, type AdapterConfig, type AdapterUser } from "./BaseAdapter.js";
export declare class TeamsAdapter extends BaseAdapter {
    id: string;
    name: string;
    icon: string;
    description: string;
    private token;
    start(): Promise<void>;
    stop(): Promise<void>;
    getConfig(): AdapterConfig;
    setConfig(config: AdapterConfig): Promise<void>;
    getUsers(): AdapterUser[];
    getRequiredConfigKeys(): string[];
}
//# sourceMappingURL=TeamsAdapter.d.ts.map