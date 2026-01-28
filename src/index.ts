import { client } from "./discord/client.js";
import { CONFIG } from "./config/env.js";

// Start the bot
client.login(CONFIG.DISCORD_TOKEN);
