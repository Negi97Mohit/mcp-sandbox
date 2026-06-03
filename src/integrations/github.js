/**
 * github.ts — GitHub REST API client for SDLC integration.
 *
 * Provides typed wrappers around GitHub API endpoints needed by the
 * Orchestrator and GitHub tools: issues, PRs, file contents, branches.
 *
 * Auth: GitHub Personal Access Token via GITHUB_TOKEN env var.
 */
import { CONFIG } from "../config/env.js";
class GitHubClient {
    baseUrl = "https://api.github.com";
    get headers() {
        const token = CONFIG.GITHUB_TOKEN;
        if (!token) {
            throw new Error("GITHUB_TOKEN not set in .env");
        }
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        };
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const init = {
            method,
            headers: this.headers,
        };
        if (body !== undefined) {
            init.body = JSON.stringify(body);
        }
        const resp = await fetch(url, init);
        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`GitHub API ${method} ${path} → ${resp.status}: ${err}`);
        }
        return resp.json();
    }
    // ── Issues ─────────────────────────────────────────────────────────────
    async listIssues(owner, repo, state = "open") {
        const data = await this.request("GET", `/repos/${owner}/${repo}/issues?state=${state}&per_page=20`);
        return data
            .filter((i) => !i.pull_request) // exclude PRs from issues list
            .map((i) => ({
            number: i.number,
            title: i.title,
            body: i.body ?? "",
            state: i.state,
            labels: i.labels.map((l) => l.name),
            assignees: i.assignees.map((a) => a.login),
            created_at: i.created_at,
            html_url: i.html_url,
            priority: i.labels.find((l) => l.name.startsWith("priority"))?.name,
        }));
    }
    async getIssue(owner, repo, issueNumber) {
        const i = await this.request("GET", `/repos/${owner}/${repo}/issues/${issueNumber}`);
        return {
            number: i.number,
            title: i.title,
            body: i.body ?? "",
            state: i.state,
            labels: i.labels.map((l) => l.name),
            assignees: i.assignees.map((a) => a.login),
            created_at: i.created_at,
            html_url: i.html_url,
            priority: i.labels.find((l) => l.name.startsWith("priority"))?.name,
        };
    }
    async addIssueComment(owner, repo, issueNumber, body) {
        await this.request("POST", `/repos/${owner}/${repo}/issues/${issueNumber}/comments`, { body });
    }
    // ── Pull Requests ──────────────────────────────────────────────────────
    async createPR(opts) {
        const data = await this.request("POST", `/repos/${opts.owner}/${opts.repo}/pulls`, {
            title: opts.title,
            body: opts.body,
            head: opts.head,
            base: opts.base,
            draft: opts.draft ?? false,
        });
        return {
            number: data.number,
            title: data.title,
            html_url: data.html_url,
            state: data.state,
            head: data.head.ref,
            base: data.base.ref,
        };
    }
    async addPRReviewComment(owner, repo, prNumber, body, commitId, path, line) {
        await this.request("POST", `/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
            body, commit_id: commitId, path, line,
        });
    }
    async listPRs(owner, repo, state = "open") {
        const data = await this.request("GET", `/repos/${owner}/${repo}/pulls?state=${state}&per_page=10`);
        return data.map((p) => ({
            number: p.number,
            title: p.title,
            html_url: p.html_url,
            state: p.state,
            head: p.head.ref,
            base: p.base.ref,
        }));
    }
    // ── Repository ─────────────────────────────────────────────────────────
    async getFileContent(owner, repo, filePath, ref = "main") {
        const data = await this.request("GET", `/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`);
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return { path: data.path, content, sha: data.sha, encoding: data.encoding };
    }
    async createBranch(opts) {
        // Get SHA of the source branch
        const ref = await this.request("GET", `/repos/${opts.owner}/${opts.repo}/git/ref/heads/${opts.fromBranch ?? "main"}`);
        const sha = ref.object.sha;
        await this.request("POST", `/repos/${opts.owner}/${opts.repo}/git/refs`, {
            ref: `refs/heads/${opts.branchName}`,
            sha,
        });
    }
    async listRepoInfo(owner, repo) {
        return this.request("GET", `/repos/${owner}/${repo}`);
    }
    /** Extract owner/repo from a GitHub remote URL */
    static parseRemoteUrl(remoteUrl) {
        // Handles: https://github.com/owner/repo.git and git@github.com:owner/repo.git
        const httpsMatch = remoteUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
        const sshMatch = remoteUrl.match(/github\.com:([^/]+)\/([^/.]+)/);
        const match = httpsMatch ?? sshMatch;
        if (!match || !match[1] || !match[2])
            return null;
        return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
}
export const githubClient = new GitHubClient();
//# sourceMappingURL=github.js.map