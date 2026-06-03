import { BaseAdapter, type AdapterConfig, type AdapterUser } from "./BaseAdapter.js";

export class TeamsAdapter extends BaseAdapter {
    id = "teams";
    name = "Microsoft Teams";
    icon = "👥";
    description = "Stub adapter for Microsoft Teams. Shows the extensibility pattern.";
    private token: string = "";

    async start(): Promise<void> {
        this.status = "starting";
        console.log("Teams adapter start requested (Stub).");
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.status = "stopped";
        this.error = "Teams adapter not yet implemented. Install Microsoft Bot Framework to enable.";
    }

    async stop(): Promise<void> {
        this.status = "stopped";
    }

    getConfig(): AdapterConfig {
        return {
            token: this.token,
        };
    }

    async setConfig(config: AdapterConfig): Promise<void> {
        if (config["token"] !== undefined) {
            this.token = String(config["token"]);
        }
    }

    getUsers(): AdapterUser[] {
        return [];
    }

    getRequiredConfigKeys(): string[] {
        return ["TEAMS_APP_PASSWORD"];
    }
}
