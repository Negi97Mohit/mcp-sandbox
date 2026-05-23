"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWorkspaceHandlers = registerWorkspaceHandlers;
const electron_1 = require("electron");
const WorkspaceStore_js_1 = require("../../src/core/WorkspaceStore.js");
function registerWorkspaceHandlers() {
    electron_1.ipcMain.handle("workspaces:list", () => {
        return WorkspaceStore_js_1.workspaceStore.list();
    });
    electron_1.ipcMain.handle("workspaces:create", (_event, name, dirPath) => {
        try {
            const ws = WorkspaceStore_js_1.workspaceStore.create(name, dirPath);
            return { success: true, workspace: ws };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.handle("workspaces:delete", (_event, id) => {
        try {
            WorkspaceStore_js_1.workspaceStore.delete(id);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.handle("workspaces:set-active", (_event, id) => {
        try {
            WorkspaceStore_js_1.workspaceStore.setActive(id);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.handle("workspaces:get-active", () => {
        return WorkspaceStore_js_1.workspaceStore.getActive();
    });
    electron_1.ipcMain.handle("workspaces:browse", async () => {
        const result = await electron_1.dialog.showOpenDialog({
            title: "Select Workspace Directory",
            properties: ["openDirectory", "createDirectory"],
        });
        if (result.canceled || result.filePaths.length === 0)
            return null;
        return result.filePaths[0];
    });
}
//# sourceMappingURL=workspaceHandlers.js.map