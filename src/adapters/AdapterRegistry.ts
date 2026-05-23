import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { type BaseAdapter } from "./BaseAdapter.js";
import { DiscordAdapter } from "./DiscordAdapter.js";
import { SlackAdapter } from "./SlackAdapter.js";
import { TeamsAdapter } from "./TeamsAdapter.js";

class AdapterRegistry extends EventEmitter {
    private adapters: Map<string, BaseAdapter> = new Map();
    private configPath = path.join(process.cwd(), "adapter_configs.json");

    constructor() {
        super();
        // Register default adapters
        this.register(new DiscordAdapter());
        this.register(new SlackAdapter());
        this.register(new TeamsAdapter());
        this.loadConfigs();
    }

    register(adapter: BaseAdapter) {
        this.adapters.set(adapter.id, adapter);
    }

    getAll(): BaseAdapter[] {
        return Array.from(this.adapters.values());
    }

    getById(id: string): BaseAdapter | undefined {
        return this.adapters.get(id);
    }

    async startAdapter(id: string): Promise<void> {
        const adapter = this.adapters.get(id);
        if (!adapter) throw new Error(`Adapter ${id} not found`);
        
        adapter.status = "starting";
        this.emit("status-change", id, "starting");
        try {
            await adapter.start();
            adapter.status = "running";
            this.emit("status-change", id, "running");
            this.saveConfigs();
        } catch (err: any) {
            adapter.status = "error";
            adapter.error = err.message || String(err);
            this.emit("status-change", id, "error", adapter.error);
            throw err;
        }
    }

    async stopAdapter(id: string): Promise<void> {
        const adapter = this.adapters.get(id);
        if (!adapter) throw new Error(`Adapter ${id} not found`);

        this.emit("status-change", id, "stopping");
        try {
            await adapter.stop();
            adapter.status = "stopped";
            this.emit("status-change", id, "stopped");
        } catch (err: any) {
            adapter.status = "error";
            adapter.error = err.message || String(err);
            this.emit("status-change", id, "error", adapter.error);
            throw err;
        }
    }

    private loadConfigs() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
                for (const [id, config] of Object.entries(data)) {
                    const adapter = this.adapters.get(id);
                    if (adapter && typeof config === "object" && config !== null) {
                        adapter.setConfig(config as any);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load adapter configurations:", err);
        }
    }

    private saveConfigs() {
        try {
            const data: Record<string, any> = {};
            for (const [id, adapter] of this.adapters.entries()) {
                data[id] = adapter.getConfig();
            }
            fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), "utf-8");
        } catch (err) {
            console.error("Failed to save adapter configurations:", err);
        }
    }
}

export const adapterRegistry = new AdapterRegistry();
export { type BaseAdapter };
