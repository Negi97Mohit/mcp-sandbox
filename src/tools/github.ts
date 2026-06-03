/**
 * github.ts (tools) — LLM-facing tool definitions and handlers for GitHub.
 *
 * These tools are registered in the tool registry and exposed to all agents.
 * Each tool maps to a typed GitHub API call via githubClient.
 */

import { githubClient } from "../integrations/github.js";
import { CONFIG } from "../config/env.js";
import type { ToolContext } from "../types/toolContext.js";

export const githubTools = [
  {
    type: "function",
    function: {
      name: "github_list_issues",
      description: "List open issues from a GitHub repository. Returns issue numbers, titles, labels, and priority.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub repository owner (username or org)" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state filter (default: open)" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_get_issue",
      description: "Get full details of a specific GitHub issue including body, labels, and assignees.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issue_number: { type: "number", description: "The issue number" },
        },
        required: ["owner", "repo", "issue_number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_create_pr",
      description: "Create a pull request on GitHub. Use after implementing and verifying changes.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          title: { type: "string", description: "PR title (use conventional commit format, e.g. 'fix: ...')" },
          body: { type: "string", description: "PR description in markdown" },
          head: { type: "string", description: "Source branch name" },
          base: { type: "string", description: "Target branch (usually 'main')" },
          draft: { type: "boolean", description: "Create as draft PR" },
        },
        required: ["owner", "repo", "title", "body", "head", "base"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_read_file",
      description: "Read the content of a file from a GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          path: { type: "string", description: "File path relative to repo root" },
          ref: { type: "string", description: "Branch, tag, or commit SHA (default: main)" },
        },
        required: ["owner", "repo", "path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_list_prs",
      description: "List pull requests in a GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          state: { type: "string", enum: ["open", "closed", "all"] },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_add_issue_comment",
      description: "Add a comment to a GitHub issue (e.g. to report agent progress).",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issue_number: { type: "number" },
          body: { type: "string", description: "Comment text in markdown" },
        },
        required: ["owner", "repo", "issue_number", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_create_branch",
      description: "Create a new git branch in a GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          branch_name: { type: "string", description: "Name of the new branch" },
          from_branch: { type: "string", description: "Source branch (default: main)" },
        },
        required: ["owner", "repo", "branch_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github_repo_info",
      description: "Get metadata about a GitHub repository (description, default branch, topics, stars).",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
        },
        required: ["owner", "repo"],
      },
    },
  },
];

export async function handleGitHubTool(name: string, args: any, _context?: ToolContext): Promise<unknown> {
  if (!CONFIG.GITHUB_TOKEN) {
    return { error: "GITHUB_TOKEN not configured. Add it to your .env file." };
  }

  try {
    switch (name) {
      case "github_list_issues": {
        const issues = await githubClient.listIssues(args.owner, args.repo, args.state ?? "open");
        return {
          issues: issues.map((i) => ({
            number: i.number,
            title: i.title,
            body: i.body?.substring(0, 500),
            labels: i.labels,
            priority: i.priority ?? "unset",
            url: i.html_url,
          })),
          count: issues.length,
        };
      }

      case "github_get_issue": {
        const issue = await githubClient.getIssue(args.owner, args.repo, args.issue_number);
        return issue;
      }

      case "github_create_pr": {
        const pr = await githubClient.createPR({
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          body: args.body,
          head: args.head,
          base: args.base ?? "main",
          draft: args.draft ?? false,
        });
        return { success: true, pr_number: pr.number, url: pr.html_url };
      }

      case "github_read_file": {
        const file = await githubClient.getFileContent(args.owner, args.repo, args.path, args.ref ?? "main");
        return { path: file.path, content: file.content.substring(0, 4000), sha: file.sha };
      }

      case "github_list_prs": {
        const prs = await githubClient.listPRs(args.owner, args.repo, args.state ?? "open");
        return { prs, count: prs.length };
      }

      case "github_add_issue_comment": {
        await githubClient.addIssueComment(args.owner, args.repo, args.issue_number, args.body);
        return { success: true };
      }

      case "github_create_branch": {
        await githubClient.createBranch({
          owner: args.owner,
          repo: args.repo,
          branchName: args.branch_name,
          fromBranch: args.from_branch ?? "main",
        });
        return { success: true, branch: args.branch_name };
      }

      case "github_repo_info": {
        const info = await githubClient.listRepoInfo(args.owner, args.repo);
        return info;
      }

      default:
        return { error: `Unknown GitHub tool: ${name}` };
    }
  } catch (e: any) {
    return { error: e.message };
  }
}
