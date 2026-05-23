"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllIpcHandlers = registerAllIpcHandlers;
const configHandlers_js_1 = require("./configHandlers.js");
const userHandlers_js_1 = require("./userHandlers.js");
const healthHandlers_js_1 = require("./healthHandlers.js");
const platformHandlers_js_1 = require("./platformHandlers.js");
const chatHandlers_js_1 = require("./chatHandlers.js");
const actionHandlers_js_1 = require("./actionHandlers.js");
const windowHandlers_js_1 = require("./windowHandlers.js");
const workspaceHandlers_js_1 = require("./workspaceHandlers.js");
const customToolHandlers_js_1 = require("./customToolHandlers.js");
function registerAllIpcHandlers() {
    (0, configHandlers_js_1.registerConfigHandlers)();
    (0, userHandlers_js_1.registerUserHandlers)();
    (0, healthHandlers_js_1.registerHealthHandlers)();
    (0, platformHandlers_js_1.registerPlatformHandlers)();
    (0, chatHandlers_js_1.registerChatHandlers)();
    (0, actionHandlers_js_1.registerActionHandlers)();
    (0, windowHandlers_js_1.registerWindowHandlers)();
    (0, workspaceHandlers_js_1.registerWorkspaceHandlers)();
    (0, customToolHandlers_js_1.registerCustomToolHandlers)();
}
//# sourceMappingURL=index.js.map