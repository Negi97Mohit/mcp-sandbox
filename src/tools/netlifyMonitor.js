import { monitorStore } from "../services/netlifyMonitorStore.js";
import { getGitRemoteUrl, findNetlifySiteByRepo, getNetlifySite } from "../services/netlifyUtils.js";
export const netlifyMonitorTools = [
    {
        type: "function",
        function: {
            name: "netlify_monitor_add",
            description: "Add a Netlify project to the deployment monitor for this Discord channel. Supports local folder paths or Git URLs.",
            parameters: {
                type: "object",
                properties: {
                    target: {
                        type: "string",
                        description: "The local folder path (e.g., C:\\Users\\Desktop\\app) OR the Git repository URL (e.g., https://github.com/user/repo) of the Netlify project."
                    }
                },
                required: ["target"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_monitor_list",
            description: "List all Netlify projects currently being monitored in this Discord channel.",
            parameters: {
                type: "object",
                properties: {},
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_monitor_remove",
            description: "Remove a Netlify project from the deployment monitor in this Discord channel.",
            parameters: {
                type: "object",
                properties: {
                    siteIdOrName: {
                        type: "string",
                        description: "The Netlify Site ID or Name to remove from monitoring."
                    }
                },
                required: ["siteIdOrName"],
            },
        },
    }
];
export async function handleNetlifyMonitorTool(name, args, context) {
    if (!context || !context.channelId) {
        return { error: "This tool must be run within a Discord channel context." };
    }
    if (name === "netlify_monitor_add") {
        try {
            await context.sendLog("🔍 *Analyzing target...*");
            let repoUrl = args.target;
            let localPath = null;
            // Check if it's a local path
            if (args.target.includes("\\") || args.target.includes("/")) {
                const isHttp = args.target.startsWith("http://") || args.target.startsWith("https://") || args.target.startsWith("git@");
                if (!isHttp) {
                    localPath = args.target;
                    repoUrl = await getGitRemoteUrl(localPath);
                    if (!repoUrl) {
                        return { error: `Could not determine the Git remote URL for local path: ${localPath}. Ensure it is a valid Git repository with an 'origin' remote.` };
                    }
                }
            }
            await context.sendLog(`🔍 *Searching Netlify for a site linked to repository: ${repoUrl}*`);
            const netlifySite = await findNetlifySiteByRepo(repoUrl);
            if (!netlifySite) {
                return { error: `Could not find any Netlify site linked to the repository: ${repoUrl}. Make sure the site is deployed from this repository and you have access to it.` };
            }
            const siteId = netlifySite.id;
            const siteName = netlifySite.name;
            const monitorId = `${siteId}_${context.channelId}`;
            monitorStore.addSite({
                id: monitorId,
                repoUrl,
                localPath,
                netlifySiteId: siteId,
                netlifySiteName: siteName,
                discordChannelId: context.channelId
            });
            return {
                success: true,
                message: `✅ Successfully added Netlify site **${siteName}** to the deployment monitor for this channel!`,
                siteId: siteId,
                siteName: siteName,
                repoUrl: repoUrl
            };
        }
        catch (error) {
            return { error: `Failed to add monitor: ${error.message}` };
        }
    }
    if (name === "netlify_monitor_list") {
        const sites = monitorStore.getSites().filter(s => s.discordChannelId === context.channelId);
        if (sites.length === 0) {
            return { message: "No Netlify sites are currently being monitored in this channel." };
        }
        let listText = "**Monitored Netlify Sites:**\n";
        sites.forEach((site, index) => {
            listText += `${index + 1}. **${site.netlifySiteName}** (ID: \`${site.netlifySiteId}\`)\n   Repo: ${site.repoUrl}\n`;
        });
        return { message: listText, count: sites.length, sites };
    }
    if (name === "netlify_monitor_remove") {
        try {
            const siteInfo = await getNetlifySite(args.siteIdOrName);
            if (!siteInfo) {
                // Try removing by just ID just in case
                monitorStore.removeSite(args.siteIdOrName, context.channelId);
                return { success: true, message: `Attempted to remove site with ID/Name: ${args.siteIdOrName}` };
            }
            monitorStore.removeSite(siteInfo.id, context.channelId);
            return { success: true, message: `✅ Removed Netlify site **${siteInfo.name}** from monitoring.` };
        }
        catch (error) {
            return { error: `Failed to remove monitor: ${error.message}` };
        }
    }
    return { error: `Unknown tool: ${name}` };
}
//# sourceMappingURL=netlifyMonitor.js.map