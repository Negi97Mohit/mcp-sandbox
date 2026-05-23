import { client } from '../discord/client.js';
import { monitorStore } from './netlifyMonitorStore.js';
import { CONFIG } from '../config/env.js';
import { callOpenRouter } from '../llm/openRouter.js';
import axios from 'axios';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { smartSplitMessage } from '../discord/utils.js';
const POLLING_INTERVAL = 30000; // 30 seconds
export function startNetlifyDaemon() {
    console.log("🚀 Starting Netlify Monitor Daemon...");
    // Run immediately, then every interval
    pollNetlify();
    setInterval(pollNetlify, POLLING_INTERVAL);
}
async function pollNetlify() {
    if (!CONFIG.NETLIFY_TOKEN) {
        console.warn("⚠️ Netlify daemon requires NETLIFY_TOKEN to poll deployments.");
        return;
    }
    const sites = monitorStore.getSites();
    if (sites.length === 0)
        return;
    for (const site of sites) {
        try {
            await checkDeploymentsForSite(site);
        }
        catch (error) {
            console.error(`Error checking deployments for site ${site.netlifySiteName}:`, error.message);
        }
    }
}
async function checkDeploymentsForSite(site) {
    const response = await axios.get(`https://api.netlify.com/api/v1/sites/${site.netlifySiteId}/deploys`, {
        headers: { Authorization: `Bearer ${CONFIG.NETLIFY_TOKEN}` },
        params: { per_page: 5 } // Only need recent ones
    });
    const deploys = response.data;
    if (deploys.length === 0)
        return;
    // Ordered by newest first. Let's find the first finished/errored deploy
    let mostRecentCompletedDeploy = deploys.find((d) => d.state === 'ready' || d.state === 'error');
    if (!mostRecentCompletedDeploy)
        return; // All still building
    // If we haven't seen this deploy before, or if it changed state from 'building' to 'ready'/'error' in our tracker (though our tracker only saves finished ones for simplicity).
    // The easiest robust way: we only process it if its ID is DIFFERENT from `lastSeenDeployId`.
    if (site.lastSeenDeployId === mostRecentCompletedDeploy.id) {
        return; // Already processed
    }
    // Found a NEW completed deploy!
    console.log(`[Netlify Monitor] New deploy state for ${site.netlifySiteName}: ${mostRecentCompletedDeploy.state} (ID: ${mostRecentCompletedDeploy.id})`);
    // Save it
    monitorStore.updateLastSeenDeploy(site.id, mostRecentCompletedDeploy.id);
    // Report it to Discord
    await reportDeployState(site, mostRecentCompletedDeploy);
}
async function reportDeployState(site, deploy) {
    try {
        const channel = await client.channels.fetch(site.discordChannelId);
        if (!channel || !channel.isSendable()) {
            console.error(`[Netlify Monitor] Could not fetch channel ${site.discordChannelId} to report deploy.`);
            return;
        }
        const isSuccess = deploy.state === 'ready';
        const color = isSuccess ? 0x00FF00 : 0xFF0000; // Green or Red
        const commitMsg = deploy.title || deploy.commit_message || "Manual Deploy";
        const deployUrl = deploy.deploy_ssl_url || deploy.url;
        const duration = deploy.deploy_time ? `${deploy.deploy_time}s` : 'Unknown';
        const embed = new EmbedBuilder()
            .setTitle(isSuccess ? `✅ Deployment Successful: ${site.netlifySiteName}` : `❌ Deployment Failed: ${site.netlifySiteName}`)
            .setColor(color)
            .addFields({ name: 'Commit', value: deploy.commit_ref ? `\`${deploy.commit_ref.substring(0, 7)}\`` : 'N/A', inline: true }, { name: 'Branch', value: deploy.branch || 'main', inline: true }, { name: 'Duration', value: duration, inline: true }, { name: 'Message', value: commitMsg || 'No message' })
            .setTimestamp()
            .setURL(deploy.log_access_attributes?.url || `https://app.netlify.com/sites/${site.netlifySiteName}/deploys/${deploy.id}`);
        await channel.send({ embeds: [embed] });
        // If it failed, perform Root Cause Analysis
        if (!isSuccess) {
            await performRCA(channel, site, deploy);
        }
    }
    catch (error) {
        console.error(`[Netlify Monitor] Failed to send report to Discord:`, error);
    }
}
async function performRCA(channel, site, deploy) {
    try {
        const loadingMessage = await channel.send("🔍 *Fetching build logs and running AI Root Cause Analysis...*");
        // 1. Fetch Logs
        const logsResponse = await axios.get(`https://api.netlify.com/api/v1/deploys/${deploy.id}/logs`, {
            headers: { Authorization: `Bearer ${CONFIG.NETLIFY_TOKEN}` }
        });
        // Logs might be an object with structured lines, or raw text. It's usually a large JSON object or raw text stream depending on the endpoint.
        // Actually, the standard API might return JSON? We'll capture stringified representation just in case.
        let logsRaw = logsResponse.data;
        if (typeof logsRaw !== 'string') {
            // Netlify logs can sometimes be line objects
            if (Array.isArray(logsRaw)) {
                logsRaw = logsRaw.map((l) => l.log || "").join('\n');
            }
            else if (logsRaw?.data) {
                logsRaw = JSON.stringify(logsRaw.data);
            }
            else {
                logsRaw = JSON.stringify(logsRaw);
            }
        }
        // We only need the last X lines for errors usually. Let's take the bottom 3000 chars.
        const logSnippet = logsRaw.substring(Math.max(0, logsRaw.length - 3000));
        // 2. Build Prompt
        const prompt = `You are a DevOps assistant analyzing a failed Netlify deployment.
Here are the final build logs:

\`\`\`
${logSnippet}
\`\`\`

Analyze the build log and provide:
1. **Root Cause**: What exactly failed? What file/module/command caused it?
2. **Proposed Fix**: How should the user fix this issue? Give specific code changes or commands if possible.

Keep the response concise, formatted beautifully in Markdown. Do not use any tools for this, just answer.`;
        // 3. Call LLM
        const aiResponse = await callOpenRouter([
            { role: "user", content: prompt }
        ]);
        const rcaContent = aiResponse.content || "Could not generate analysis.";
        // 4. Send Result
        await loadingMessage.edit(`**🤖 AI Root Cause Analysis**`);
        const chunks = smartSplitMessage(rcaContent, 1900);
        for (const chunk of chunks) {
            await channel.send(chunk);
        }
    }
    catch (error) {
        console.error(`[Netlify Monitor] Error during RCA:`, error.message);
        await channel.send(`❌ *Failed to perform AI Root Cause Analysis: ${error.message}*`);
    }
}
//# sourceMappingURL=netlifyDaemon.js.map