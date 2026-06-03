export interface MonitoredSite {
    id: string;
    repoUrl: string | null;
    localPath: string | null;
    netlifySiteId: string;
    netlifySiteName: string;
    discordChannelId: string;
    lastSeenDeployId?: string | null;
}
export declare class NetlifyMonitorStore {
    private sites;
    constructor();
    private load;
    private save;
    getSites(): MonitoredSite[];
    addSite(site: MonitoredSite): void;
    removeSite(netlifySiteId: string, discordChannelId: string): void;
    updateLastSeenDeploy(siteId: string, deployId: string): void;
}
export declare const monitorStore: NetlifyMonitorStore;
//# sourceMappingURL=netlifyMonitorStore.d.ts.map