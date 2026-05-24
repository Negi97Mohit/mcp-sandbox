export interface AdapterConfig {
    [key: string]: string | boolean | number;
}

export interface AdapterUser {
    id: string;
    username: string;
    platform: string;
    role: string;
    lastActive?: string;
}

export abstract class BaseAdapter {
    abstract id: string;
    abstract name: string;
    abstract icon: string;          // emoji or icon name
    abstract description: string;
    status: 'running' | 'stopped' | 'error' | 'starting' = 'stopped';
    error?: string | undefined;

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract getConfig(): AdapterConfig;
    abstract setConfig(config: AdapterConfig): Promise<void>;
    abstract getUsers(): AdapterUser[];
    abstract getRequiredConfigKeys(): string[];
}
