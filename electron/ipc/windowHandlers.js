"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWindowHandlers = registerWindowHandlers;
const electron_1 = require("electron");
function registerWindowHandlers() {
    // Legacy: minimize to tray
    electron_1.ipcMain.handle("window:minimize-tray", () => {
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win)
            win.hide();
        return { success: true };
    });
    // Frameless window controls
    electron_1.ipcMain.handle("window:minimize", () => {
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win)
            win.minimize();
    });
    electron_1.ipcMain.handle("window:maximize", () => {
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (!win)
            return;
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    });
    electron_1.ipcMain.handle("window:close", () => {
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win)
            win.close();
    });
    electron_1.ipcMain.handle("window:is-maximized", () => {
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        return win ? win.isMaximized() : false;
    });
    // Emit maximize state changes to renderer
    electron_1.app.on("browser-window-created", (_event, win) => {
        win.on("maximize", () => {
            win.webContents.send("window:maximize-change", true);
        });
        win.on("unmaximize", () => {
            win.webContents.send("window:maximize-change", false);
        });
    });
    electron_1.ipcMain.handle("app:auto-launch:get", () => {
        try {
            const settings = electron_1.app.getLoginItemSettings();
            return settings.openAtLogin;
        }
        catch (e) {
            console.error("Failed to get login item settings:", e);
            return false;
        }
    });
    electron_1.ipcMain.handle("app:auto-launch:set", (_event, enabled) => {
        try {
            electron_1.app.setLoginItemSettings({
                openAtLogin: enabled,
                path: electron_1.app.getPath("exe"),
            });
            return { success: true };
        }
        catch (e) {
            console.error("Failed to set login item settings:", e);
            return { success: false, error: String(e) };
        }
    });
}
//# sourceMappingURL=windowHandlers.js.map