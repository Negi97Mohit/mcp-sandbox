import { ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { CONFIG } from "../../src/config/env.js";
import { graphStore } from "../../src/core/GraphStore.js";

// ─── Cache for OpenRouter models ─────────────────────────────────────────────
let cachedModels: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Fallback hardcoded models (used when API fetch fails)
const FALLBACK_MODELS = [
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 3 Nano 30B (Free)" },
    { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B Instruct (Free)" },
    { id: "google/gemma-3-1b-it:free", name: "Gemma 3 1B IT (Free)" },
    { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct (Free)" },
    { id: "qwen/qwen3-0.6b:free", name: "Qwen3 0.6B (Free)" },
    { id: "microsoft/phi-3-mini-128k-instruct:free", name: "Phi-3 Mini 128K (Free)" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Paid)" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Paid)" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat (Paid)" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (Paid)" },
];

/**
 * Fetch all available models from OpenRouter's API.
 * Results are cached for 10 minutes.
 */
async function fetchOpenRouterModels(): Promise<any[]> {
    const now = Date.now();
    if (cachedModels && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedModels;
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "HTTP-Referer": "https://discord-agent.com",
                "X-Title": "Gaki - Development Kit",
            },
        });

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch OpenRouter models: ${response.status}`);
            return cachedModels || FALLBACK_MODELS;
        }

        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) {
            return cachedModels || FALLBACK_MODELS;
        }

        // Filter: only FREE text models (max_price=0, input_modalities=text)
        const freeTextModels = data.data.filter((m: any) => {
            // Must be free: prompt and completion pricing both "0"
            const isFree = m.id?.endsWith(":free") ||
                (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
            if (!isFree) return false;

            // Must support text input modality
            const modalities = m.architecture?.modality?.split("->")?.[0] || "";
            const inputMods: string[] = m.input_modalities || [];
            const hasTextInput = inputMods.includes("text") ||
                modalities.includes("text") ||
                inputMods.length === 0; // If no modality info, assume text

            return hasTextInput;
        });

        // Map to our format
        const models = freeTextModels.map((m: any) => {
            const contextLength = m.context_length ? ` (${Math.round(m.context_length / 1024)}K ctx)` : "";
            return {
                id: m.id,
                name: m.name || m.id,
                description: m.description?.substring(0, 120) || "",
                contextLength: m.context_length || 0,
                isFree: true,
                pricing: "Free",
                displayName: `${m.name || m.id}${contextLength} [Free]`,
            };
        });

        // Sort alphabetically by name
        models.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

        cachedModels = models;
        cacheTimestamp = now;
        console.log(`✅ Fetched ${models.length} free text models from OpenRouter`);
        return models;

    } catch (err: any) {
        console.warn(`⚠️ OpenRouter model fetch failed: ${err.message}`);
        return cachedModels || FALLBACK_MODELS;
    }
}

export function registerConfigHandlers() {
    // Return FULL unmasked config — the UI handles show/hide via Eye toggle
    ipcMain.handle("config:get", () => {
        return { ...CONFIG };
    });

    ipcMain.handle("config:set", async (_event, updates: Record<string, string>) => {
        const envPath = path.join(process.cwd(), ".env");
        let envContent = "";
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf-8");
        }

        const lines = envContent.split(/\r?\n/);
        for (const [key, val] of Object.entries(updates)) {
            // Skip empty or unchanged values
            if (!val && !(CONFIG as any)[key]) continue;

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

            (CONFIG as any)[key] = val;
            process.env[key] = val;
        }

        fs.writeFileSync(envPath, lines.join("\n"), "utf-8");

        // Log config change to graph
        const updatedKeys = Object.keys(updates);
        if (updatedKeys.length > 0) {
            const redactedUpdates: any = {};
            for (const [k, v] of Object.entries(updates)) {
                if (!v) continue;
                if (k.includes("KEY") || k.includes("TOKEN") || k.includes("SECRET") || k.includes("PASSWORD")) {
                    redactedUpdates[k] = v.length > 8 ? `${v.substring(0, 4)}...${v.slice(-4)}` : "***";
                } else {
                    redactedUpdates[k] = v;
                }
            }
            graphStore.addNode({
                type: "user_action",
                label: "Configuration Updated",
                status: "success",
                createdBy: "user:desktop-ui",
                colorCode: "emerald",
                details: { description: `Updated configuration keys: ${updatedKeys.join(", ")}`, updates: redactedUpdates }
            });
        }

        return { success: true };
    });

    // Fetch models dynamically from OpenRouter API (cached 10min)
    ipcMain.handle("config:models", async () => {
        return await fetchOpenRouterModels();
    });
}
