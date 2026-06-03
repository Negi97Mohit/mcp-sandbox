"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConfigHandlers = registerConfigHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_js_1 = require("../../src/config/env.js");
function registerConfigHandlers() {
    electron_1.ipcMain.handle("config:get", () => {
        const masked = { ...env_js_1.CONFIG };
        if (masked.OPENROUTER_API_KEY) {
            masked.OPENROUTER_API_KEY = masked.OPENROUTER_API_KEY.substring(0, 8) + "...";
        }
        if (masked.DISCORD_TOKEN) {
            masked.DISCORD_TOKEN = masked.DISCORD_TOKEN.substring(0, 8) + "...";
        }
        if (masked.NETLIFY_TOKEN) {
            masked.NETLIFY_TOKEN = masked.NETLIFY_TOKEN.substring(0, 8) + "...";
        }
        return masked;
    });
    electron_1.ipcMain.handle("config:set", async (_event, updates) => {
        const envPath = path_1.default.join(process.cwd(), ".env");
        let envContent = "";
        if (fs_1.default.existsSync(envPath)) {
            envContent = fs_1.default.readFileSync(envPath, "utf-8");
        }
        const lines = envContent.split(/\r?\n/);
        for (const [key, val] of Object.entries(updates)) {
            // Mask validation: if it contains "..." and matches masked, skip it
            if (val.includes("...")) {
                const currentVal = env_js_1.CONFIG[key];
                if (currentVal && val === currentVal.substring(0, 8) + "...") {
                    continue;
                }
            }
            let found = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]?.trim();
                if (line && line.startsWith(`${key}=`)) {
                    lines[i] = `${key}=${val}`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                lines.push(`${key}=${val}`);
            }
            env_js_1.CONFIG[key] = val;
            process.env[key] = val;
        }
        fs_1.default.writeFileSync(envPath, lines.join("\n"), "utf-8");
        return { success: true };
    });
    electron_1.ipcMain.handle("config:models", () => {
        return [
            { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B (Free)" },
            { id: "meta-llama/llama-3-8b-instruct:free", name: "Llama 3 8B Instruct (Free)" },
            { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B IT (Free)" },
            { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
            { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
        ];
    });
}
//# sourceMappingURL=configHandlers.js.map