import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
  NETLIFY_TOKEN: process.env.NETLIFY_TOKEN || "",
  ALLOWED_USER_ID: process.env.ALLOWED_USER_ID, // Optional
  MODEL_NAME: process.env.MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free",

  // Firebase (optional)
  SERVICE_KEY_PATH: process.env.SERVICE_KEY_PATH || "service-account.json",
};

if (!CONFIG.OPENROUTER_API_KEY) {
  console.warn("⚠️ OPENROUTER_API_KEY is missing in .env");
}
if (!CONFIG.DISCORD_TOKEN) {
  console.warn("⚠️ DISCORD_TOKEN is missing in .env");
}
if (!CONFIG.NETLIFY_TOKEN) {
  console.warn("⚠️ NETLIFY_TOKEN is missing in .env");
}
