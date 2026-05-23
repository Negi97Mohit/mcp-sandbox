import { ipcMain } from "electron";
import { permissionManager } from "../../src/core/PermissionManager.js";
import { workspaceManager } from "../../src/core/WorkspaceManager.js";
import { CONFIG } from "../../src/config/env.js";
import { chatStore } from "../../src/core/ChatStore.js";

export function registerUserHandlers() {
    ipcMain.handle("users:list", () => {
        const users = permissionManager.listAll();
        const adminId = CONFIG.ALLOWED_USER_ID;
        if (adminId && !users.some(u => u.userId === adminId)) {
            users.push({ userId: adminId, role: "admin" });
        }
        return users.map(u => {
            let workspacePath = "";
            try {
                workspacePath = workspaceManager.ensureWorkspace(u.userId);
            } catch (e) {
                // Ignore
            }
            return {
                ...u,
                workspacePath,
            };
        });
    });

    ipcMain.handle("users:grant", (_event, userId: string, role: any) => {
        const adminId = CONFIG.ALLOWED_USER_ID || "admin";
        permissionManager.grant(adminId, userId, role);
        workspaceManager.ensureWorkspace(userId);
        return { success: true };
    });

    ipcMain.handle("users:revoke", (_event, userId: string) => {
        const adminId = CONFIG.ALLOWED_USER_ID || "admin";
        permissionManager.revoke(adminId, userId);
        return { success: true };
    });

    ipcMain.handle("users:workspace", (_event, userId: string) => {
        const path = workspaceManager.ensureWorkspace(userId);
        return { workspacePath: path };
    });

    ipcMain.handle("users:history", (_event, userId: string) => {
        return chatStore.getHistory(userId);
    });
}
