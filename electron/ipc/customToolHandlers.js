"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomToolHandlers = registerCustomToolHandlers;
const electron_1 = require("electron");
const CustomToolsEngine_js_1 = require("../../src/core/CustomToolsEngine.js");
function registerCustomToolHandlers() {
    electron_1.ipcMain.handle("custom-tools:list", () => {
        return CustomToolsEngine_js_1.customToolsEngine.list();
    });
    electron_1.ipcMain.handle("custom-tools:create", (_event, tool) => {
        try {
            const created = CustomToolsEngine_js_1.customToolsEngine.create(tool);
            return { success: true, tool: created };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.handle("custom-tools:update", (_event, id, updates) => {
        try {
            const updated = CustomToolsEngine_js_1.customToolsEngine.update(id, updates);
            return { success: true, tool: updated };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.handle("custom-tools:delete", (_event, id) => {
        try {
            CustomToolsEngine_js_1.customToolsEngine.delete(id);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.handle("custom-tools:run", async (_event, toolName, args) => {
        return CustomToolsEngine_js_1.customToolsEngine.run(toolName, args);
    });
}
//# sourceMappingURL=customToolHandlers.js.map