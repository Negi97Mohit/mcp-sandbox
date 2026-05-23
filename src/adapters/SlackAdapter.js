import { BaseAdapter } from "./BaseAdapter.js";
export class SlackAdapter extends BaseAdapter {
    id = "slack";
    name = "Slack";
    icon = "💻";
    description = "Stub adapter for Slack. Shows the extensibility pattern.";
    token = "";
    async start() {
        this.status = "starting";
        console.log("Slack adapter start requested (Stub).");
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.status = "stopped";
        this.error = "Slack adapter not yet implemented. Install @slack/bolt to enable.";
    }
    async stop() {
        this.status = "stopped";
    }
    getConfig() {
        return {
            token: this.token,
        };
    }
    async setConfig(config) {
        if (config["token"] !== undefined) {
            this.token = String(config["token"]);
        }
    }
    getUsers() {
        return [];
    }
    getRequiredConfigKeys() {
        return ["SLACK_BOT_TOKEN"];
    }
}
//# sourceMappingURL=SlackAdapter.js.map