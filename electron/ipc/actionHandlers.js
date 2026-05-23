"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActionHandlers = registerActionHandlers;
const electron_1 = require("electron");
const ActionLogger_js_1 = require("../../src/core/ActionLogger.js");
function registerActionHandlers() {
    electron_1.ipcMain.handle("actions:list", async (_event, filters) => {
        return await ActionLogger_js_1.actionLogger.getRecent(50, filters);
    });
    electron_1.ipcMain.handle("actions:detail", async (_event, id) => {
        return await ActionLogger_js_1.actionLogger.getById(id);
    });
}
//# sourceMappingURL=actionHandlers.js.map