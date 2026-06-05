import { registerConfigHandlers } from "./configHandlers.js";
import { registerUserHandlers } from "./userHandlers.js";
import { registerHealthHandlers } from "./healthHandlers.js";
import { registerPlatformHandlers } from "./platformHandlers.js";
import { registerChatHandlers } from "./chatHandlers.js";
import { registerActionHandlers } from "./actionHandlers.js";
import { registerWindowHandlers } from "./windowHandlers.js";
import { registerWorkspaceHandlers } from "./workspaceHandlers.js";
import { registerCustomToolHandlers } from "./customToolHandlers.js";
import { registerGraphHandlers } from "./graphHandlers.js";

export function registerAllIpcHandlers() {
    registerConfigHandlers();
    registerUserHandlers();
    registerHealthHandlers();
    registerPlatformHandlers();
    registerChatHandlers();
    registerActionHandlers();
    registerWindowHandlers();
    registerWorkspaceHandlers();
    registerCustomToolHandlers();
    registerGraphHandlers();
}
