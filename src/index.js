import { client } from "./discord/client.js";
import { CONFIG } from "./config/env.js";
import { startNetlifyDaemon } from "./services/netlifyDaemon.js";
// Start the Netlify daemon
startNetlifyDaemon();
// Start the bot
client.login(CONFIG.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map