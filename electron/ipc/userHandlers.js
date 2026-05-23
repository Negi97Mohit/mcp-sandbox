"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserHandlers = registerUserHandlers;
const electron_1 = require("electron");
const PermissionManager_js_1 = require("../../src/core/PermissionManager.js");
const WorkspaceManager_js_1 = require("../../src/core/WorkspaceManager.js");
const env_js_1 = require("../../src/config/env.js");
const ChatStore_js_1 = require("../../src/core/ChatStore.js");
function registerUserHandlers() {
    electron_1.ipcMain.handle("users:list", () => {
        const users = PermissionManager_js_1.permissionManager.listAll();
        const adminId = env_js_1.CONFIG.ALLOWED_USER_ID;
        if (adminId && !users.some(u => u.userId === adminId)) {
            users.push({ userId: adminId, role: "admin" });
        }
        return users.map(u => {
            let workspacePath = "";
            try {
                workspacePath = WorkspaceManager_js_1.workspaceManager.ensureWorkspace(u.userId);
            }
            catch (e) {
                // Ignore
            }
            return {
                ...u,
                workspacePath,
            };
        });
    });
    electron_1.ipcMain.handle("users:grant", (_event, userId, role) => {
        const adminId = env_js_1.CONFIG.ALLOWED_USER_ID || "admin";
        PermissionManager_js_1.permissionManager.grant(adminId, userId, role);
        WorkspaceManager_js_1.workspaceManager.ensureWorkspace(userId);
        return { success: true };
    });
    electron_1.ipcMain.handle("users:revoke", (_event, userId) => {
        const adminId = env_js_1.CONFIG.ALLOWED_USER_ID || "admin";
        PermissionManager_js_1.permissionManager.revoke(adminId, userId);
        return { success: true };
    });
    electron_1.ipcMain.handle("users:workspace", (_event, userId) => {
        const path = WorkspaceManager_js_1.workspaceManager.ensureWorkspace(userId);
        return { workspacePath: path };
    });
    electron_1.ipcMain.handle("users:history", (_event, userId) => {
        return ChatStore_js_1.chatStore.getHistory(userId);
    });
}
//# sourceMappingURL=userHandlers.js.map