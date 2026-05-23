import { ipcMain, app, BrowserWindow } from "electron";

export function registerWindowHandlers() {
    // Legacy: minimize to tray
    ipcMain.handle("window:minimize-tray", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.hide();
        return { success: true };
    });

    // Frameless window controls
    ipcMain.handle("window:minimize", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.minimize();
    });

    ipcMain.handle("window:maximize", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (!win) return;
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });

    ipcMain.handle("window:close", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.close();
    });

    ipcMain.handle("window:is-maximized", () => {
        const win = BrowserWindow.getAllWindows()[0];
        return win ? win.isMaximized() : false;
    });

    // Emit maximize state changes to renderer
    app.on("browser-window-created", (_event, win) => {
        win.on("maximize", () => {
            win.webContents.send("window:maximize-change", true);
        });
        win.on("unmaximize", () => {
            win.webContents.send("window:maximize-change", false);
        });
    });

    ipcMain.handle("app:auto-launch:get", () => {
        try {
            const settings = app.getLoginItemSettings();
            return settings.openAtLogin;
        } catch (e) {
            console.error("Failed to get login item settings:", e);
            return false;
        }
    });

    ipcMain.handle("app:auto-launch:set", (_event, enabled: boolean) => {
        try {
            app.setLoginItemSettings({
                openAtLogin: enabled,
                path: app.getPath("exe"),
            });
            return { success: true };
        } catch (e) {
            console.error("Failed to set login item settings:", e);
            return { success: false, error: String(e) };
        }
    });
}
