import { ipcMain } from "electron";
import { actionLogger } from "../../src/core/ActionLogger.js";

export function registerActionHandlers() {
    ipcMain.handle("actions:list", async (_event, filters: any) => {
        return await actionLogger.getRecent(50, filters);
    });

    ipcMain.handle("actions:detail", async (_event, id: string) => {
        return await actionLogger.getById(id);
    });
}
