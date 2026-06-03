"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlatformHandlers = registerPlatformHandlers;
const electron_1 = require("electron");
const AdapterRegistry_js_1 = require("../../src/adapters/AdapterRegistry.js");
function registerPlatformHandlers() {
    electron_1.ipcMain.handle("platforms:list", () => {
        return AdapterRegistry_js_1.adapterRegistry.getAll().map(adapter => ({
            id: adapter.id,
            name: adapter.name,
            icon: adapter.icon,
            description: adapter.description,
            status: adapter.status,
            error: adapter.error,
            requiredConfigKeys: adapter.getRequiredConfigKeys(),
        }));
    });
    electron_1.ipcMain.handle("platforms:start", async (_event, id) => {
        await AdapterRegistry_js_1.adapterRegistry.startAdapter(id);
        return { success: true, status: "running" };
    });
    electron_1.ipcMain.handle("platforms:stop", async (_event, id) => {
        await AdapterRegistry_js_1.adapterRegistry.stopAdapter(id);
        return { success: true, status: "stopped" };
    });
    electron_1.ipcMain.handle("platforms:config:get", (_event, id) => {
        const adapter = AdapterRegistry_js_1.adapterRegistry.getById(id);
        if (!adapter)
            throw new Error(`Adapter ${id} not found`);
        return adapter.getConfig();
    });
    electron_1.ipcMain.handle("platforms:config:set", async (_event, id, config) => {
        const adapter = AdapterRegistry_js_1.adapterRegistry.getById(id);
        if (!adapter)
            throw new Error(`Adapter ${id} not found`);
        await adapter.setConfig(config);
        return { success: true };
    });
}
//# sourceMappingURL=platformHandlers.js.map