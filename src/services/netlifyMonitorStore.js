import fs from 'fs';
import path from 'path';
const STORE_PATH = path.join(process.cwd(), 'monitored_sites.json');
export class NetlifyMonitorStore {
    sites = [];
    constructor() {
        this.load();
    }
    load() {
        try {
            if (fs.existsSync(STORE_PATH)) {
                const data = fs.readFileSync(STORE_PATH, 'utf-8');
                this.sites = JSON.parse(data);
            }
        }
        catch (error) {
            console.error("❌ Error loading monitored_sites.json:", error);
            this.sites = [];
        }
    }
    save() {
        try {
            fs.writeFileSync(STORE_PATH, JSON.stringify(this.sites, null, 4), 'utf-8');
        }
        catch (error) {
            console.error("❌ Error saving monitored_sites.json:", error);
        }
    }
    getSites() {
        return this.sites;
    }
    addSite(site) {
        // Prevent duplicate Netlify site monitoring in the same channel
        const existing = this.sites.findIndex(s => s.netlifySiteId === site.netlifySiteId && s.discordChannelId === site.discordChannelId);
        if (existing !== -1) {
            this.sites[existing] = site; // Update
        }
        else {
            this.sites.push(site);
        }
        this.save();
    }
    removeSite(netlifySiteId, discordChannelId) {
        this.sites = this.sites.filter(s => !(s.netlifySiteId === netlifySiteId && s.discordChannelId === discordChannelId));
        this.save();
    }
    updateLastSeenDeploy(siteId, deployId) {
        const site = this.sites.find(s => s.id === siteId);
        if (site) {
            site.lastSeenDeployId = deployId;
            this.save();
        }
    }
}
export const monitorStore = new NetlifyMonitorStore();
//# sourceMappingURL=netlifyMonitorStore.js.map