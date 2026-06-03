/**
 * github.ts — GitHub REST API client for SDLC integration.
 *
 * Provides typed wrappers around GitHub API endpoints needed by the
 * Orchestrator and GitHub tools: issues, PRs, file contents, branches.
 *
 * Auth: GitHub Personal Access Token via GITHUB_TOKEN env var.
 */
export interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    state: "open" | "closed";
    labels: string[];
    assignees: string[];
    created_at: string;
    html_url: string;
    priority?: string;
}
export interface GitHubPR {
    number: number;
    title: string;
    html_url: string;
    state: string;
    head: string;
    base: string;
}
export interface GitHubFileContent {
    path: string;
    content: string;
    sha: string;
    encoding: string;
}
export interface CreatePROptions {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
}
export interface CreateBranchOptions {
    owner: string;
    repo: string;
    branchName: string;
    fromBranch?: string;
}
declare class GitHubClient {
    private baseUrl;
    private get headers();
    private request;
    listIssues(owner: string, repo: string, state?: "open" | "closed" | "all"): Promise<GitHubIssue[]>;
    getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue>;
    addIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<void>;
    createPR(opts: CreatePROptions): Promise<GitHubPR>;
    addPRReviewComment(owner: string, repo: string, prNumber: number, body: string, commitId: string, path: string, line: number): Promise<void>;
    listPRs(owner: string, repo: string, state?: "open" | "closed" | "all"): Promise<GitHubPR[]>;
    getFileContent(owner: string, repo: string, filePath: string, ref?: string): Promise<GitHubFileContent>;
    createBranch(opts: CreateBranchOptions): Promise<void>;
    listRepoInfo(owner: string, repo: string): Promise<Record<string, unknown>>;
    /** Extract owner/repo from a GitHub remote URL */
    static parseRemoteUrl(remoteUrl: string): {
        owner: string;
        repo: string;
    } | null;
}
export declare const githubClient: GitHubClient;
export {};
//# sourceMappingURL=github.d.ts.map