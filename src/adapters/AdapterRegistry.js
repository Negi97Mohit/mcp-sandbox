import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import {} from "./BaseAdapter.js";
import { DiscordAdapter } from "./DiscordAdapter.js";
import { SlackAdapter } from "./SlackAdapter.js";
import { TeamsAdapter } from "./TeamsAdapter.js";
class AdapterRegistry extends EventEmitter {
    adapters = new Map();
    configPath = path.join(process.cwd(), "adapter_configs.json");
    constructor() {
        super();
        // Register default adapters
        this.register(new DiscordAdapter());
        this.register(new SlackAdapter());
        this.register(new TeamsAdapter());
        this.loadConfigs();
    }
    register(adapter) {
        this.adapters.set(adapter.id, adapter);
    }
    getAll() {
        return Array.from(this.adapters.values());
    }
    getById(id) {
        return this.adapters.get(id);
    }
    async startAdapter(id) {
        const adapter = this.adapters.get(id);
        if (!adapter)
            throw new Error(`Adapter ${id} not found`);
        adapter.status = "starting";
        this.emit("status-change", id, "starting");
        try {
            await adapter.start();
            adapter.status = "running";
            this.emit("status-change", id, "running");
            this.saveConfigs();
        }
        catch (err) {
            adapter.status = "error";
            adapter.error = err.message || String(err);
            this.emit("status-change", id, "error", adapter.error);
            throw err;
        }
    }
    async stopAdapter(id) {
        const adapter = this.adapters.get(id);
        if (!adapter)
            throw new Error(`Adapter ${id} not found`);
        this.emit("status-change", id, "stopping");
        try {
            await adapter.stop();
            adapter.status = "stopped";
            this.emit("status-change", id, "stopped");
        }
        catch (err) {
            adapter.status = "error";
            adapter.error = err.message || String(err);
            this.emit("status-change", id, "error", adapter.error);
            throw err;
        }
    }
    loadConfigs() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
                for (const [id, config] of Object.entries(data)) {
                    const adapter = this.adapters.get(id);
                    if (adapter && typeof config === "object" && config !== null) {
                        adapter.setConfig(config);
                    }
                }
            }
        }
        catch (err) {
            console.error("Failed to load adapter configurations:", err);
        }
    }
    saveConfigs() {
        try {
            const data = {};
            for (const [id, adapter] of this.adapters.entries()) {
                data[id] = adapter.getConfig();
            }
            fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), "utf-8");
        }
        catch (err) {
            console.error("Failed to save adapter configurations:", err);
        }
    }
}
export const adapterRegistry = new AdapterRegistry();
export {};
//# sourceMappingURL=AdapterRegistry.js.map