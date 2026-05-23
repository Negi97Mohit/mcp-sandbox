import { ipcMain, dialog } from "electron";
import { workspaceStore } from "../../src/core/WorkspaceStore.js";

export function registerWorkspaceHandlers() {
    ipcMain.handle("workspaces:list", () => {
        return workspaceStore.list();
    });

    ipcMain.handle("workspaces:create", (_event, name: string, dirPath: string) => {
        try {
            const ws = workspaceStore.create(name, dirPath);
            return { success: true, workspace: ws };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("workspaces:delete", (_event, id: string) => {
        try {
            workspaceStore.delete(id);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("workspaces:set-active", (_event, id: string) => {
        try {
            workspaceStore.setActive(id);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("workspaces:get-active", () => {
        return workspaceStore.getActive();
    });

    ipcMain.handle("workspaces:browse", async () => {
        const result = await dialog.showOpenDialog({
            title: "Select Workspace Directory",
            properties: ["openDirectory", "createDirectory"],
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });
}
