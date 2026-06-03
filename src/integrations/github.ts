/**
 * github.ts — GitHub REST API client for SDLC integration.
 *
 * Provides typed wrappers around GitHub API endpoints needed by the
 * Orchestrator and GitHub tools: issues, PRs, file contents, branches.
 *
 * Auth: GitHub Personal Access Token via GITHUB_TOKEN env var.
 */

import { CONFIG } from "../config/env.js";

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
  content: string; // decoded from base64
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
  fromBranch?: string; // defaults to "main"
}

class GitHubClient {
  private baseUrl = "https://api.github.com";

  private get headers(): Record<string, string> {
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

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
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

    return resp.json() as Promise<T>;
  }

  // ── Issues ─────────────────────────────────────────────────────────────

  async listIssues(owner: string, repo: string, state: "open" | "closed" | "all" = "open"): Promise<GitHubIssue[]> {
    const data = await this.request<any[]>("GET", `/repos/${owner}/${repo}/issues?state=${state}&per_page=20`);
    return data
      .filter((i) => !i.pull_request) // exclude PRs from issues list
      .map((i) => ({
        number: i.number,
        title: i.title,
        body: i.body ?? "",
        state: i.state,
        labels: i.labels.map((l: any) => l.name),
        assignees: i.assignees.map((a: any) => a.login),
        created_at: i.created_at,
        html_url: i.html_url,
        priority: i.labels.find((l: any) => l.name.startsWith("priority"))?.name,
      }));
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const i = await this.request<any>("GET", `/repos/${owner}/${repo}/issues/${issueNumber}`);
    return {
      number: i.number,
      title: i.title,
      body: i.body ?? "",
      state: i.state,
      labels: i.labels.map((l: any) => l.name),
      assignees: i.assignees.map((a: any) => a.login),
      created_at: i.created_at,
      html_url: i.html_url,
      priority: i.labels.find((l: any) => l.name.startsWith("priority"))?.name,
    };
  }

  async addIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<void> {
    await this.request("POST", `/repos/${owner}/${repo}/issues/${issueNumber}/comments`, { body });
  }

  // ── Pull Requests ──────────────────────────────────────────────────────

  async createPR(opts: CreatePROptions): Promise<GitHubPR> {
    const data = await this.request<any>("POST", `/repos/${opts.owner}/${opts.repo}/pulls`, {
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

  async addPRReviewComment(
    owner: string, repo: string, prNumber: number, body: string, commitId: string,
    path: string, line: number
  ): Promise<void> {
    await this.request("POST", `/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
      body, commit_id: commitId, path, line,
    });
  }

  async listPRs(owner: string, repo: string, state: "open" | "closed" | "all" = "open"): Promise<GitHubPR[]> {
    const data = await this.request<any[]>("GET", `/repos/${owner}/${repo}/pulls?state=${state}&per_page=10`);
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

  async getFileContent(owner: string, repo: string, filePath: string, ref = "main"): Promise<GitHubFileContent> {
    const data = await this.request<any>("GET", `/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`);
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { path: data.path, content, sha: data.sha, encoding: data.encoding };
  }

  async createBranch(opts: CreateBranchOptions): Promise<void> {
    // Get SHA of the source branch
    const ref = await this.request<any>(
      "GET",
      `/repos/${opts.owner}/${opts.repo}/git/ref/heads/${opts.fromBranch ?? "main"}`
    );
    const sha = ref.object.sha;

    await this.request("POST", `/repos/${opts.owner}/${opts.repo}/git/refs`, {
      ref: `refs/heads/${opts.branchName}`,
      sha,
    });
  }

  async listRepoInfo(owner: string, repo: string): Promise<Record<string, unknown>> {
    return this.request<any>("GET", `/repos/${owner}/${repo}`);
  }

  /** Extract owner/repo from a GitHub remote URL */
  static parseRemoteUrl(remoteUrl: string): { owner: string; repo: string } | null {
    // Handles: https://github.com/owner/repo.git and git@github.com:owner/repo.git
    const httpsMatch = remoteUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    const sshMatch = remoteUrl.match(/github\.com:([^/]+)\/([^/.]+)/);
    const match = httpsMatch ?? sshMatch;
    if (!match || !match[1] || !match[2]) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  }
}

export const githubClient = new GitHubClient();
