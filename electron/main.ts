import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from "path";
import fs from "fs";
import { registerAllIpcHandlers } from "./ipc/index.js";
import { CONFIG } from "../src/config/env.js";
import { startNetlifyDaemon } from "../src/services/netlifyDaemon.js";
import { adapterRegistry } from "../src/adapters/AdapterRegistry.js";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: "Gaki - Development Kit",
        titleBarStyle: "hidden",
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: getAppIcon(),
    });

    // In development, load from Vite dev server
    if (process.env.NODE_ENV === "development" || !app.isPackaged) {
        mainWindow.loadURL("http://localhost:5173").catch((err) => {
            console.error("Vite server not ready, attempting reload in 2s...", err);
            setTimeout(() => {
                mainWindow?.loadURL("http://localhost:5173");
            }, 2000);
        });
        // Open DevTools in dev mode
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built HTML file
        mainWindow.loadFile(path.join(app.getAppPath(), "desktop-ui/dist/index.html")).catch((err) => {
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
    const iconPath = path.join(app.getAppPath(), "assets/icon.png");
    if (fs.existsSync(iconPath)) {
        return nativeImage.createFromPath(iconPath);
    }
    return undefined;
}

function createTray() {
    const trayIconPath = path.join(app.getAppPath(), "assets/tray-icon.png");
    let trayIcon;

    if (fs.existsSync(trayIconPath)) {
        trayIcon = nativeImage.createFromPath(trayIconPath);
    } else {
        // Fallback transparent 16x16 PNG
        trayIcon = nativeImage.createFromBuffer(
            Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMElEQVR42mNk+M9QD0DMyIDGz0Ax0BhGBpoDBhYw0Bgw0BgwsICBxoCBxQDNDgYGBgC2LwMt1P9vBgAAAABJRU5ErkJggg==",
                "base64"
            )
        );
    }

    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
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
                    await adapterRegistry.stopAdapter("discord");
                } catch (e) {
                    // Ignore if already stopped
                }
                try {
                    await adapterRegistry.startAdapter("discord");
                } catch (e) {
                    console.error("Failed to restart Discord bot:", e);
                }
            },
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Gaki Development Kit");
    tray.setContextMenu(contextMenu);

    tray.on("double-click", () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
}

app.whenReady().then(async () => {
    console.log("Initializing Gaki Development Kit native app...");

    // Register all IPC handlers
    registerAllIpcHandlers();

    // Create the Window
    createWindow();

    // Create system tray icon
    createTray();

    // Start Netlify Monitor Daemon if key present
    if (CONFIG.NETLIFY_TOKEN) {
        try {
            startNetlifyDaemon();
        } catch (e) {
            console.error("Failed to start Netlify Daemon:", e);
        }
    }

    // Auto-start Discord bot if token is configured
    if (CONFIG.DISCORD_TOKEN) {
        console.log("Auto-starting Discord adapter...");
        try {
            await adapterRegistry.startAdapter("discord");
        } catch (e) {
            console.error("Failed to auto-start Discord adapter:", e);
        }
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

app.on("before-quit", () => {
    isQuitting = true;
});
