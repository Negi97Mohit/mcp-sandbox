export declare function getGitRemoteUrl(localPath: string): Promise<string | null>;
/**
 * Strips credentials and normalizes github/gitlab URLs for comparison
 */
export declare function normalizeGitUrl(url: string): string;
/**
 * Matches a Git URL with the one found in Netlify Site info
 */
export declare function isSameRepo(url1: string | null | undefined, url2: string | null | undefined): boolean;
/**
 * Searches for a Netlify site that matches the given git Repo URL
 */
export declare function findNetlifySiteByRepo(repoUrl: string): Promise<any | null>;
/**
 * Gets a specific Netlify site by Name or ID
 */
export declare function getNetlifySite(siteIdOrName: string): Promise<any | null>;
//# sourceMappingURL=netlifyUtils.d.ts.map