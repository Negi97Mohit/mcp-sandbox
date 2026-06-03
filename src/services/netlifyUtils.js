import { simpleGit } from 'simple-git';
import axios from 'axios';
import { CONFIG } from '../config/env.js';
import fs from 'fs';
export async function getGitRemoteUrl(localPath) {
    try {
        if (!fs.existsSync(localPath)) {
            throw new Error(`Path does not exist: ${localPath}`);
        }
        const git = simpleGit(localPath);
        const remotes = await git.getRemotes(true);
        const origin = remotes.find((r) => r.name === 'origin');
        if (origin && origin.refs?.fetch) {
            return origin.refs.fetch;
        }
        const firstRemote = remotes[0];
        if (firstRemote && firstRemote.refs?.fetch) {
            return firstRemote.refs.fetch;
        }
        return null;
    }
    catch (error) {
        console.error(`Error getting git remote for ${localPath}:`, error.message);
        return null;
    }
}
/**
 * Strips credentials and normalizes github/gitlab URLs for comparison
 */
export function normalizeGitUrl(url) {
    return url
        .replace(/^https?:\/\/[^@]+@/, 'https://') // Remove credentials
        .replace(/\.git$/, '') // Remove .git suffix
        .toLowerCase()
        .trim();
}
/**
 * Matches a Git URL with the one found in Netlify Site info
 */
export function isSameRepo(url1, url2) {
    if (!url1 || !url2)
        return false;
    return normalizeGitUrl(url1) === normalizeGitUrl(url2);
}
/**
 * Searches for a Netlify site that matches the given git Repo URL
 */
export async function findNetlifySiteByRepo(repoUrl) {
    if (!CONFIG.NETLIFY_TOKEN) {
        throw new Error("NETLIFY_TOKEN is missing in the environment config.");
    }
    try {
        // Fetch all sites (paginated, simple fetch for now assuming a reasonable number of sites)
        const response = await axios.get('https://api.netlify.com/api/v1/sites', {
            headers: {
                Authorization: `Bearer ${CONFIG.NETLIFY_TOKEN}`
            }
        });
        const sites = response.data;
        // Find site matching repo URL
        const matchingSite = sites.find((site) => {
            const siteRepo = site.build_settings?.repo_url;
            return isSameRepo(siteRepo, repoUrl);
        });
        return matchingSite || null;
    }
    catch (error) {
        console.error("Error fetching Netlify sites:", error.response?.data || error.message);
        throw new Error("Failed to communicate with Netlify API.");
    }
}
/**
 * Gets a specific Netlify site by Name or ID
 */
export async function getNetlifySite(siteIdOrName) {
    if (!CONFIG.NETLIFY_TOKEN) {
        throw new Error("NETLIFY_TOKEN is missing in the environment config.");
    }
    try {
        // If it looks like a domain, try to find it
        if (siteIdOrName.includes('.')) {
            const response = await axios.get('https://api.netlify.com/api/v1/sites', {
                headers: {
                    Authorization: `Bearer ${CONFIG.NETLIFY_TOKEN}`
                }
            });
            return response.data.find((s) => s.name === siteIdOrName || s.default_domain === siteIdOrName) || null;
        }
        else {
            // Treat as ID
            const response = await axios.get(`https://api.netlify.com/api/v1/sites/${siteIdOrName}`, {
                headers: {
                    Authorization: `Bearer ${CONFIG.NETLIFY_TOKEN}`
                }
            });
            return response.data;
        }
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=netlifyUtils.js.map