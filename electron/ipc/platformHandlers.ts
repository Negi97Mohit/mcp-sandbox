import { ipcMain } from "electron";
import { adapterRegistry } from "../../src/adapters/AdapterRegistry.js";

export function registerPlatformHandlers() {
    ipcMain.handle("platforms:list", () => {
        return adapterRegistry.getAll().map(adapter => ({
            id: adapter.id,
            name: adapter.name,
            icon: adapter.icon,
            description: adapter.description,
            status: adapter.status,
            error: adapter.error,
            requiredConfigKeys: adapter.getRequiredConfigKeys(),
        }));
    });

    ipcMain.handle("platforms:start", async (_event, id: string) => {
        await adapterRegistry.startAdapter(id);
        return { success: true, status: "running" };
    });

    ipcMain.handle("platforms:stop", async (_event, id: string) => {
        await adapterRegistry.stopAdapter(id);
        return { success: true, status: "stopped" };
    });

    ipcMain.handle("platforms:config:get", (_event, id: string) => {
        const adapter = adapterRegistry.getById(id);
        if (!adapter) throw new Error(`Adapter ${id} not found`);
        return adapter.getConfig();
    });

    ipcMain.handle("platforms:config:set", async (_event, id: string, config: any) => {
        const adapter = adapterRegistry.getById(id);
        if (!adapter) throw new Error(`Adapter ${id} not found`);
        await adapter.setConfig(config);
        return { success: true };
    });
}
