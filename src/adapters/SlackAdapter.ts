import { BaseAdapter, type AdapterConfig, type AdapterUser } from "./BaseAdapter.js";

export class SlackAdapter extends BaseAdapter {
    id = "slack";
    name = "Slack";
    icon = "💻";
    description = "Stub adapter for Slack. Shows the extensibility pattern.";
    private token: string = "";

    async start(): Promise<void> {
        this.status = "starting";
        console.log("Slack adapter start requested (Stub).");
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.status = "stopped";
        this.error = "Slack adapter not yet implemented. Install @slack/bolt to enable.";
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
        return ["SLACK_BOT_TOKEN"];
    }
}
