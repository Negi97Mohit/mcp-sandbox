"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_js_1 = require("./ipc/index.js");
const env_js_1 = require("../src/config/env.js");
const netlifyDaemon_js_1 = require("../src/services/netlifyDaemon.js");
const AdapterRegistry_js_1 = require("../src/adapters/AdapterRegistry.js");
let mainWindow = null;
let tray = null;
let isQuitting = false;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: "MCP Sandbox",
        titleBarStyle: "hidden",
        frame: false,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: getAppIcon(),
    });
    // In development, load from Vite dev server
    if (process.env.NODE_ENV === "development" || !electron_1.app.isPackaged) {
        mainWindow.loadURL("http://localhost:5173").catch((err) => {
            console.error("Vite server not ready, attempting reload in 2s...", err);
            setTimeout(() => {
                mainWindow?.loadURL("http://localhost:5173");
            }, 2000);
        });
        // Open DevTools in dev mode
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production, load the built HTML file
        mainWindow.loadFile(path_1.default.join(__dirname, "../desktop-ui/dist/index.html")).catch((err) => {
            console.error("Failed to load production HTML:", err);
        });
    }
    mainWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
function getAppIcon() {
    const iconPath = path_1.default.join(__dirname, "../assets/icon.png");
    if (fs_1.default.existsSync(iconPath)) {
        return electron_1.nativeImage.createFromPath(iconPath);
    }
    return undefined;
}
function createTray() {
    const trayIconPath = path_1.default.join(__dirname, "../assets/tray-icon.png");
    let trayIcon;
    if (fs_1.default.existsSync(trayIconPath)) {
        trayIcon = electron_1.nativeImage.createFromPath(trayIconPath);
    }
    else {
        // Fallback transparent 16x16 PNG
        trayIcon = electron_1.nativeImage.createFromBuffer(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMElEQVR42mNk+M9QD0DMyIDGz0Ax0BhGBpoDBhYw0Bgw0BgwsICBxoCBxQDNDgYGBgC2LwMt1P9vBgAAAABJRU5ErkJggg==", "base64"));
    }
    tray = new electron_1.Tray(trayIcon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "Show Control Panel",
            click: () => {
                mainWindow?.show();
                mainWindow?.focus();
            },
        },
        { type: "separator" },
        {
            label: "Restart Discord Bot",
            click: async () => {
                console.log("Restarting Discord bot...");
                try {
                    await AdapterRegistry_js_1.adapterRegistry.stopAdapter("discord");
                }
                catch (e) {
                    // Ignore if already stopped
                }
                try {
                    await AdapterRegistry_js_1.adapterRegistry.startAdapter("discord");
                }
                catch (e) {
                    console.error("Failed to restart Discord bot:", e);
                }
            },
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                isQuitting = true;
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip("MCP Sandbox Control Panel");
    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
}
electron_1.app.whenReady().then(async () => {
    console.log("Initializing MCP Sandbox native app...");
    // Register all IPC handlers
    (0, index_js_1.registerAllIpcHandlers)();
    // Create the Window
    createWindow();
    // Create system tray icon
    createTray();
    // Start Netlify Monitor Daemon if key present
    if (env_js_1.CONFIG.NETLIFY_TOKEN) {
        try {
            (0, netlifyDaemon_js_1.startNetlifyDaemon)();
        }
        catch (e) {
            console.error("Failed to start Netlify Daemon:", e);
        }
    }
    // Auto-start Discord bot if token is configured
    if (env_js_1.CONFIG.DISCORD_TOKEN) {
        console.log("Auto-starting Discord adapter...");
        try {
            await AdapterRegistry_js_1.adapterRegistry.startAdapter("discord");
        }
        catch (e) {
            console.error("Failed to auto-start Discord adapter:", e);
        }
    }
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
    else {
        mainWindow.show();
    }
});
electron_1.app.on("before-quit", () => {
    isQuitting = true;
});
//# sourceMappingURL=main.js.map