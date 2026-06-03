import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export const CONFIG = {
    // ── Core ───────────────────────────────────────────────────────────
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
    NETLIFY_TOKEN: process.env.NETLIFY_TOKEN || "",
    ALLOWED_USER_ID: process.env.ALLOWED_USER_ID,
    MODEL_NAME: process.env.MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free",

    // ── GitHub SDLC Integration ────────────────────────────────────────
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
    /** Default repo for GitHub tools when not specified by user (owner/repo) */
    GITHUB_DEFAULT_REPO: process.env.GITHUB_DEFAULT_REPO || "",

    // ── LLM Tracing (Langfuse) ─────────────────────────────────────────
    /** Get keys at https://cloud.langfuse.com — EU region available */
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || "",
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || "",
    LANGFUSE_HOST: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",

    // ── Firebase (optional) ───────────────────────────────────────────
    SERVICE_KEY_PATH: process.env.SERVICE_KEY_PATH || "service-account.json",
};

// Function to reload CONFIG dynamically when .env changes
export function reloadConfig() {
    try {
        dotenv.config({ override: true });
        CONFIG.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
        CONFIG.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
        CONFIG.NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || "";
        CONFIG.ALLOWED_USER_ID = process.env.ALLOWED_USER_ID;
        CONFIG.MODEL_NAME = process.env.MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free";
        CONFIG.GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
        CONFIG.GITHUB_DEFAULT_REPO = process.env.GITHUB_DEFAULT_REPO || "";
        CONFIG.LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY || "";
        CONFIG.LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY || "";
        CONFIG.LANGFUSE_HOST = process.env.LANGFUSE_HOST || "https://cloud.langfuse.com";
        CONFIG.SERVICE_KEY_PATH = process.env.SERVICE_KEY_PATH || "service-account.json";
        
        console.log("♻️  CONFIG reloaded dynamically from .env. Active OPENROUTER_API_KEY status:", CONFIG.OPENROUTER_API_KEY ? "Loaded" : "Missing");
    } catch (e) {
        console.error("❌ Failed to reload CONFIG from .env file:", e);
    }
}

// Watch .env file for changes
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    try {
        let watchTimeout: NodeJS.Timeout | null = null;
        fs.watch(envPath, (eventType) => {
            if (eventType === "change") {
                if (watchTimeout) clearTimeout(watchTimeout);
                watchTimeout = setTimeout(() => {
                    reloadConfig();
                }, 100);
            }
        });
    } catch (e) {
        console.warn("⚠️ Failed to setup .env file watch listener:", e);
    }
}

// ── Startup Warnings ───────────────────────────────────────────────────────
if (!CONFIG.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY is missing in .env");
if (!CONFIG.DISCORD_TOKEN)      console.warn("⚠️  DISCORD_TOKEN is missing in .env");
if (!CONFIG.NETLIFY_TOKEN)      console.warn("⚠️  NETLIFY_TOKEN is missing (Netlify features disabled)");
if (!CONFIG.GITHUB_TOKEN)       console.warn("⚠️  GITHUB_TOKEN is missing (GitHub tools disabled)");
if (!CONFIG.LANGFUSE_SECRET_KEY) console.log("📊  LANGFUSE keys not set — tracing in LOCAL mode only");

