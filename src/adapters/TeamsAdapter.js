import { BaseAdapter } from "./BaseAdapter.js";
export class TeamsAdapter extends BaseAdapter {
    id = "teams";
    name = "Microsoft Teams";
    icon = "👥";
    description = "Stub adapter for Microsoft Teams. Shows the extensibility pattern.";
    token = "";
    async start() {
        this.status = "starting";
        console.log("Teams adapter start requested (Stub).");
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.status = "stopped";
        this.error = "Teams adapter not yet implemented. Install Microsoft Bot Framework to enable.";
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
        return ["TEAMS_APP_PASSWORD"];
    }
}
//# sourceMappingURL=TeamsAdapter.js.map