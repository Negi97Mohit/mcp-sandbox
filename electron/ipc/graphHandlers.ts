import { ipcMain, BrowserWindow, dialog } from "electron";
import { graphStore } from "../../src/core/GraphStore.js";
import * as fs from "fs";

export function registerGraphHandlers() {
    ipcMain.handle("graph:get", () => {
        return graphStore.getGraph();
    });

    ipcMain.handle("graph:revert", async (_event, nodeId: string) => {
        return await graphStore.revertToNode(nodeId);
    });

    ipcMain.handle("graph:clear", () => {
        graphStore.clearGraph();
        return { success: true };
    });

    ipcMain.handle("graph:list", () => {
        return graphStore.listSessions();
    });

    ipcMain.handle("graph:load", (_event, sessionId: string) => {
        const success = graphStore.loadSession(sessionId);
        return { success };
    });

    ipcMain.handle("graph:save", async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return { success: false, error: "No window found" };

        const { filePath } = await dialog.showSaveDialog(win, {
            title: "Export Gaki Tree Graph",
            defaultPath: "gaki_tree_graph.json",
            filters: [{ name: "JSON Files", extensions: ["json"] }]
        });

        if (!filePath) return { success: false, error: "Save cancelled" };

        try {
            const data = graphStore.getGraph();
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
            return { success: true, filePath };
        } catch (e: any) {
            return { success: false, error: e.message || String(e) };
        }
    });

    // Register callback to stream graph updates live to React windows
    graphStore.onChange((graph) => {
        BrowserWindow.getAllWindows().forEach((win) => {
            if (!win.isDestroyed()) {
                win.webContents.send("graph:update", graph);
            }
        });
    });
}
