import { BaseAdapter, type AdapterConfig, type AdapterUser } from "./BaseAdapter.js";
import { client } from "../discord/client.js";
import { CONFIG } from "../config/env.js";
import { permissionManager } from "../core/PermissionManager.js";

export class DiscordAdapter extends BaseAdapter {
    id = "discord";
    name = "Discord";
    icon = "💬";
    description = "Connects the DevOps agent to your Discord server.";

    constructor() {
        super();
        // Hook into client state if possible
        client.on("ready", () => {
            this.status = "running";
            this.error = undefined;
        });
        client.on("error", (err) => {
            this.status = "error";
            this.error = err.message;
        });
    }

    async start(): Promise<void> {
        this.status = "starting";
        try {
            if (!CONFIG.DISCORD_TOKEN) {
                throw new Error("Discord token is missing in .env");
            }
            await client.login(CONFIG.DISCORD_TOKEN);
            this.status = "running";
            this.error = undefined;
        } catch (err: any) {
            this.status = "error";
            this.error = err.message || String(err);
            console.error("Failed to start Discord adapter:", err);
            throw err;
        }
    }

    async stop(): Promise<void> {
        try {
            client.destroy();
            this.status = "stopped";
            this.error = undefined;
        } catch (err: any) {
            this.status = "error";
            this.error = err.message || String(err);
            console.error("Failed to stop Discord adapter:", err);
            throw err;
        }
    }

    getConfig(): AdapterConfig {
        return {
            discord_token: CONFIG.DISCORD_TOKEN || "",
            alloweduserid: CONFIG.ALLOWED_USER_ID || "",
            model_name: CONFIG.MODEL_NAME || "",
        };
    }

    async setConfig(config: AdapterConfig): Promise<void> {
        const token = config["discord_token"] !== undefined ? config["discord_token"] : config["token"];
        if (token !== undefined) {
            CONFIG.DISCORD_TOKEN = String(token);
            process.env.DISCORD_TOKEN = CONFIG.DISCORD_TOKEN;
        }

        const allowedUserId = config["alloweduserid"] !== undefined ? config["alloweduserid"] : config["allowedUserId"];
        if (allowedUserId !== undefined) {
            CONFIG.ALLOWED_USER_ID = String(allowedUserId);
            process.env.ALLOWED_USER_ID = CONFIG.ALLOWED_USER_ID;
        }

        const modelName = config["model_name"] !== undefined ? config["model_name"] : config["modelName"];
        if (modelName !== undefined) {
            CONFIG.MODEL_NAME = String(modelName);
            process.env.MODEL_NAME = CONFIG.MODEL_NAME;
        }

        // Sync changes back to .env
        try {
            const fs = await import("fs");
            const path = await import("path");
            const envPath = path.join(process.cwd(), ".env");
            let envContent = "";
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, "utf-8");
            }
            const lines = envContent.split(/\r?\n/);
            const updates = {
                DISCORD_TOKEN: CONFIG.DISCORD_TOKEN || "",
                ALLOWED_USER_ID: CONFIG.ALLOWED_USER_ID || "",
                MODEL_NAME: CONFIG.MODEL_NAME || "",
            };
            for (const [key, val] of Object.entries(updates)) {
                let found = false;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i]?.trim().startsWith(`${key}=`)) {
                        lines[i] = `${key}=${val}`;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    lines.push(`${key}=${val}`);
                }
            }
            fs.writeFileSync(envPath, lines.join("\n"), "utf-8");
        } catch (e) {
            console.error("Failed to sync new config to .env file:", e);
        }
    }

    getUsers(): AdapterUser[] {
        const users = permissionManager.listAll();
        return users.map((u) => ({
            id: u.userId,
            username: `User-${u.userId.substring(0, 5)}`,
            platform: "discord",
            role: u.role,
        }));
    }

    getRequiredConfigKeys(): string[] {
        return ["DISCORD_TOKEN"];
    }
}
