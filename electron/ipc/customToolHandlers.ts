import { ipcMain } from "electron";
import { customToolsEngine } from "../../src/core/CustomToolsEngine.js";

export function registerCustomToolHandlers() {
    ipcMain.handle("custom-tools:list", () => {
        return customToolsEngine.list();
    });

    ipcMain.handle("custom-tools:create", (_event, tool: any) => {
        try {
            const created = customToolsEngine.create(tool);
            return { success: true, tool: created };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("custom-tools:update", (_event, id: string, updates: any) => {
        try {
            const updated = customToolsEngine.update(id, updates);
            return { success: true, tool: updated };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("custom-tools:delete", (_event, id: string) => {
        try {
            customToolsEngine.delete(id);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("custom-tools:run", async (_event, toolName: string, args: any) => {
        return customToolsEngine.run(toolName, args);
    });
}
