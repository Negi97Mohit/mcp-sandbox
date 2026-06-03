import React, { useState, useEffect, useRef } from "react";
import {
    Wrench, Plus, Trash2, Play, Code2, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle2, RefreshCw, Pencil, Save, X, Copy,
    Sparkles, HelpCircle, FileText, Hammer, Loader2,
} from "lucide-react";
import { api } from "../api/bridge.js";

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid var(--border)",
        color: copied ? "var(--success)" : "var(--text-secondary)",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: 500,
        transition: "all 0.2s"
      }}
      title="Copy to clipboard"
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.borderColor = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        if (!copied) e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {copied ? <CheckCircle2 size={12} color="var(--success)" /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "8px",
          background: "rgba(15, 15, 30, 0.95)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          width: "220px",
          zIndex: 9999,
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          lineHeight: "1.4",
          whiteSpace: "normal",
          pointerEvents: "none",
          display: "block"
        }}>
          {content}
        </span>
      )}
    </span>
  );
};

const formatInlineStyles = (str: string) => {
  const parts = [];
  let currentIdx = 0;
  let i = 0;
  while (i < str.length) {
    if (str.substring(i, i + 2) === "**") {
      if (i > currentIdx) {
        parts.push(str.substring(currentIdx, i));
      }
      const closeIdx = str.indexOf("**", i + 2);
      if (closeIdx !== -1) {
        parts.push(<strong key={i} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{str.substring(i + 2, closeIdx)}</strong>);
        i = closeIdx + 2;
        currentIdx = i;
      } else {
        i += 2;
      }
    } else if (str[i] === "`") {
      if (i > currentIdx) {
        parts.push(str.substring(currentIdx, i));
      }
      const closeIdx = str.indexOf("`", i + 1);
      if (closeIdx !== -1) {
        parts.push(<code key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", padding: "2px 5px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", color: "var(--primary)" }}>{str.substring(i + 1, closeIdx)}</code>);
        i = closeIdx + 1;
        currentIdx = i;
      } else {
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  if (currentIdx < str.length) {
    parts.push(str.substring(currentIdx));
  }
  return parts.length > 0 ? parts : str;
};

const MarkdownViewer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split("\n");
  let inCodeBlock = false;
  let codeLines: string[] = [];
  
  return (
    <div style={{ lineHeight: "1.6", fontSize: "13px", color: "var(--text-secondary)" }}>
      {lines.map((line, idx) => {
        if (line.trim().startsWith("```")) {
          if (inCodeBlock) {
            inCodeBlock = false;
            const content = codeLines.join("\n");
            codeLines = [];
            return (
              <pre key={idx} style={{
                background: "rgba(5, 5, 20, 0.65)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "10px",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "rgba(203,213,225,0.9)",
                overflowX: "auto",
                margin: "12px 0"
              }}>
                {content}
              </pre>
            );
          } else {
            inCodeBlock = true;
            return null;
          }
        }
        if (inCodeBlock) {
          codeLines.push(line);
          return null;
        }
        if (line.startsWith("# ")) {
          return <h1 key={idx} style={{ fontSize: "18px", fontWeight: 700, margin: "16px 0 8px", color: "var(--text-primary)" }}>{line.substring(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={idx} style={{ fontSize: "16px", fontWeight: 600, margin: "14px 0 6px", color: "var(--text-primary)" }}>{line.substring(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={idx} style={{ fontSize: "14px", fontWeight: 600, margin: "12px 0 4px", color: "var(--text-primary)" }}>{line.substring(4)}</h3>;
        }
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const content = line.trim().substring(2);
          return (
            <li key={idx} style={{ marginLeft: "16px", margin: "4px 0" }}>
              {formatInlineStyles(content)}
            </li>
          );
        }
        if (line.trim() === "") return <div key={idx} style={{ height: "8px" }} />;
        return <p key={idx} style={{ margin: "6px 0" }}>{formatInlineStyles(line)}</p>;
      })}
    </div>
  );
};

const ENV_TOOLTIPS: Record<string, string> = {
    GITHUB_TOKEN: "To get a GitHub Token: 1) Go to GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic). 2) Click 'Generate new token' with 'repo' scope. 3) Copy and add GITHUB_TOKEN=your_token in .env.",
    NETLIFY_TOKEN: "To get a Netlify Token: 1) Go to Netlify User Settings > Applications > Personal access tokens. 2) Click 'Generate new token'. 3) Copy and add NETLIFY_TOKEN=your_token in .env.",
    OPENROUTER_API_KEY: "To get an OpenRouter Key: 1) Log in to openrouter.ai. 2) Go to Keys and click 'Create Key'. 3) Add OPENROUTER_API_KEY=your_key in .env.",
    DISCORD_TOKEN: "To get a Discord Token: 1) Go to Discord Developer Portal > Applications. 2) Click Bot > Reset Token. 3) Copy and add DISCORD_TOKEN=your_token in .env."
};

interface ToolParam {
    name: string;
    type: "string" | "number" | "boolean";
    description: string;
    required: boolean;
}

interface CustomTool {
    id: string;
    name: string;
    description: string;
    parameters: ToolParam[];
    code: string;
    createdAt: string;
}

const DEFAULT_CODE = `// Available: args (your parameters), console.log()
// Return your result value at the end
// Example:
const { message } = args;
return { output: 'Hello, ' + (message || 'World') + '!' };`;

const TEMPLATES = [
    {
        label: "Hello World",
        code: `const { name } = args;\nreturn { message: 'Hello, ' + (name || 'World') + '!' };`,
    },
    {
        label: "JSON Format",
        code: `const { json_string } = args;\ntry {\n  const parsed = JSON.parse(json_string);\n  return { formatted: JSON.stringify(parsed, null, 2) };\n} catch(e) {\n  return { error: 'Invalid JSON: ' + e.message };\n}`,
    },
    {
        label: "String Transform",
        code: `const { text, operation } = args;\nlet output = text;\nif (operation === 'upper') output = text.toUpperCase();\nelse if (operation === 'lower') output = text.toLowerCase();\nelse if (operation === 'reverse') output = text.split('').reverse().join('');\nreturn { output };`,
    },
];

interface BuiltInTool {
    name: string;
    description: string;
    parameters: ToolParam[];
    agentUsage: string;
    requiredConfigKeys?: string[];
    sourceFile: string;
    howToUse: string;
    howToModify: string;
}

const BUILTIN_TOOLS: BuiltInTool[] = [
    {
        name: "run_shell",
        description: "Executes shell commands (git, npm, build) inside the active workspace.",
        parameters: [
            { name: "command", type: "string", description: "The command to run in the workspace directory", required: true }
        ],
        agentUsage: "Used by ImplementerAgent and VerifierAgent to compile, run tests, and perform git actions.",
        sourceFile: "src/tools/shell.ts",
        howToUse: "The agent will execute commands like 'npm run test' or 'git status' automatically during planning or execution steps. You can trigger this by telling Gaki to run a specific command or script.",
        howToModify: "Edit the command execution options or security filters in 'src/tools/shell.ts'. For instance, you can restrict certain unsafe binaries or add environment prependers here."
    },
    {
        name: "read_file",
        description: "Reads content from a file inside the active workspace.",
        parameters: [
            { name: "path", type: "string", description: "Path to the file to read", required: true }
        ],
        agentUsage: "Used by PlannerAgent and VerifierAgent to examine source code and check for compile/runtime errors.",
        sourceFile: "src/tools/files.ts",
        howToUse: "Agents run this tool to inspect project files. You can also ask Gaki: 'show me the contents of src/index.ts'.",
        howToModify: "Modify limits on file read sizes, add custom encoding supports, or configure access check rules in 'src/tools/files.ts'."
    },
    {
        name: "write_file",
        description: "Writes content to a file inside the active workspace.",
        parameters: [
            { name: "path", type: "string", description: "Path to the file to create or modify", required: true },
            { name: "content", type: "string", description: "Text content to write into the file", required: true }
        ],
        agentUsage: "Used by ImplementerAgent to apply bug fixes and implement new features.",
        sourceFile: "src/tools/files.ts",
        howToUse: "The agent uses this to write output code or write configuration files. You can trigger it by asking Gaki: 'create a new file called test.js with hello world'.",
        howToModify: "Modify permissions, configure backup generation prior to writes, or restrict modifications to specific folders/extensions in 'src/tools/files.ts'."
    },
    {
        name: "list_files",
        description: "Lists files and directories inside the active workspace.",
        parameters: [
            { name: "path", type: "string", description: "Sub-directory path to list (optional)", required: false }
        ],
        agentUsage: "Used by PlannerAgent to discover project files and directory structures.",
        sourceFile: "src/tools/files.ts",
        howToUse: "The agent uses this to survey the directory structure. You can trigger it by asking Gaki: 'what files do we have in this project?'.",
        howToModify: "Modify file filter logic, exclude specific folders (like node_modules, dist) dynamically, or adjust maximum depth bounds in 'src/tools/files.ts'."
    },
    {
        name: "find_git_repos",
        description: "Searches for git repositories starting from a given directory path.",
        parameters: [
            { name: "start_path", type: "string", description: "Directory path to start searching recursively (defaults to User Home)", required: false },
            { name: "max_depth", type: "number", description: "Maximum search depth (default: 5)", required: false }
        ],
        agentUsage: "Used by PlannerAgent when requested to locate repositories on the local system.",
        sourceFile: "src/tools/search.ts",
        howToUse: "The agent scans local folders to register codebases. You can run it by asking: 'scan my Desktop for git repos'.",
        howToModify: "Adjust search filters, system folders to ignore, or optimization thresholds in 'src/tools/search.ts'."
    },
    {
        name: "github_list_issues",
        description: "Lists open issues with labels, priorities, and assignees in the configured GitHub repository.",
        parameters: [
            { name: "owner", type: "string", description: "GitHub repository owner", required: true },
            { name: "repo", type: "string", description: "GitHub repository name", required: true },
            { name: "state", type: "string", description: "Filter by issue state (open/closed/all)", required: false }
        ],
        agentUsage: "Used by Orchestrator to scan for backlog tasks or specific bugs assigned to the agent.",
        requiredConfigKeys: ["GITHUB_TOKEN"],
        sourceFile: "src/tools/github.ts",
        howToUse: "Used by Gaki to fetch issue queues. Run it by asking: 'what are the current issues in owner/repo on github?'.",
        howToModify: "Adjust API query params, sorting options, or pagination limits in 'src/tools/github.ts'."
    },
    {
        name: "github_get_issue",
        description: "Retrieves details and comments for a specific issue from GitHub.",
        parameters: [
            { name: "owner", type: "string", description: "GitHub repository owner", required: true },
            { name: "repo", type: "string", description: "GitHub repository name", required: true },
            { name: "issue_number", type: "number", description: "The issue number to retrieve", required: true }
        ],
        agentUsage: "Used by Orchestrator to read context and instructions for implementing a bugfix.",
        requiredConfigKeys: ["GITHUB_TOKEN"],
        sourceFile: "src/tools/github.ts",
        howToUse: "Run it by asking: 'fetch details for issue #12 in owner/repo on github'.",
        howToModify: "Include additional issue fields, user metadata, or modify comment filtering rules in 'src/tools/github.ts'."
    },
    {
        name: "github_create_pr",
        description: "Creates a pull request on GitHub from a development branch to a target branch.",
        parameters: [
            { name: "owner", type: "string", description: "GitHub repository owner", required: true },
            { name: "repo", type: "string", description: "GitHub repository name", required: true },
            { name: "title", type: "string", description: "Pull request title", required: true },
            { name: "body", type: "string", description: "Detailed description of modifications made", required: true },
            { name: "head", type: "string", description: "The source/feature branch", required: true },
            { name: "base", type: "string", description: "The target branch (e.g. main)", required: true }
        ],
        agentUsage: "Used by Orchestrator to submit the completed, verified fix back for review (requires human reaction gate).",
        requiredConfigKeys: ["GITHUB_TOKEN"],
        sourceFile: "src/tools/github.ts",
        howToUse: "Executed when work is complete and tested. Ask Gaki: 'submit a pull request with my changes'.",
        howToModify: "Add default templates for PR descriptions, auto-assign reviewers, or configure labels in 'src/tools/github.ts'."
    },
    {
        name: "netlify_site_manage",
        description: "Manages sites, builds, and deploys on your Netlify account.",
        parameters: [
            { name: "action", type: "string", description: "Netlify action to perform (e.g. list, deploy, status)", required: true },
            { name: "site_id", type: "string", description: "Netlify Site ID (required for site-specific actions)", required: false }
        ],
        agentUsage: "Used by ImplementerAgent to check deploy status or trigger web previews.",
        requiredConfigKeys: ["NETLIFY_TOKEN"],
        sourceFile: "src/tools/netlify.ts",
        howToUse: "Ask Gaki: 'deploy my site to netlify' or 'check netlify build status'.",
        howToModify: "Extend netlify SDK integration, adjust deploy log levels, or add support for custom subdomains in 'src/tools/netlify.ts'."
    },
    {
        name: "netlify_monitor_add",
        description: "Add a Netlify project to the deployment monitor for this Discord channel. Supports local folder paths or Git URLs.",
        parameters: [
            { name: "target", type: "string", description: "The local folder path OR the Git repository URL of the Netlify project.", required: true }
        ],
        agentUsage: "Used to wire webhook deployment alerts into a channel.",
        requiredConfigKeys: ["NETLIFY_TOKEN"],
        sourceFile: "src/tools/netlifyMonitor.ts",
        howToUse: "Ask Gaki: 'add netlify monitor for my repository URL'.",
        howToModify: "Modify parsing logic for Git repository URLs or local folder detection in 'src/tools/netlifyMonitor.ts'."
    },
    {
        name: "netlify_monitor_list",
        description: "List all Netlify projects currently being monitored in this Discord channel.",
        parameters: [],
        agentUsage: "Used to inspect current deployment alert settings.",
        requiredConfigKeys: ["NETLIFY_TOKEN"],
        sourceFile: "src/tools/netlifyMonitor.ts",
        howToUse: "Ask Gaki: 'what netlify sites are we monitoring?'.",
        howToModify: "Customize the formatted string or JSON returned from the list command in 'src/tools/netlifyMonitor.ts'."
    },
    {
        name: "netlify_monitor_remove",
        description: "Remove a Netlify project from the deployment monitor in this Discord channel.",
        parameters: [
            { name: "siteIdOrName", type: "string", description: "The Netlify Site ID or Name to remove from monitoring.", required: true }
        ],
        agentUsage: "Used to disable webhook deployment alerts for a site.",
        requiredConfigKeys: ["NETLIFY_TOKEN"],
        sourceFile: "src/tools/netlifyMonitor.ts",
        howToUse: "Ask Gaki: 'remove netlify monitor for site-name'.",
        howToModify: "Change confirmation checks or cleanup handlers for deleted sites in 'src/tools/netlifyMonitor.ts'."
    }
];

export const CustomTools: React.FC = () => {
    const [tools, setTools] = useState<CustomTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [runningId, setRunningId] = useState<string | null>(null);
    const [runArgs, setRunArgs] = useState<Record<string, string>>({});
    const [runResults, setRunResults] = useState<Record<string, any>>({});
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", description: "", parameters: [] as ToolParam[], code: DEFAULT_CODE });
    const [activeTab, setActiveTab] = useState<"custom" | "builtin">("custom");
    const [config, setConfig] = useState<any>({});
    const [expandedBuiltin, setExpandedBuiltin] = useState<string | null>(null);

    // AI Tool Assistant & Generator States
    const [activeAiTool, setActiveAiTool] = useState<{ name: string; isCustom: boolean; sourceFile?: string } | null>(null);
    const [aiMode, setAiMode] = useState<"menu" | "explain" | "modify" | "view_file">("menu");
    const [aiInput, setAiInput] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState("");
    const [aiLogs, setAiLogs] = useState<string[]>([]);
    const [aiDiff, setAiDiff] = useState("");
    const [aiError, setAiError] = useState("");
    const [toolFileContent, setToolFileContent] = useState("");
    const [diffApproved, setDiffApproved] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const [showAiGen, setShowAiGen] = useState(false);
    const [aiGenForm, setAiGenForm] = useState({
        prompt: "",
        name: "",
        parameters: [] as { name: string; type: "string" | "number" | "boolean"; description: string; required: boolean }[],
        apiUrl: "",
        expectedOutput: "",
    });
    const [aiGenLoading, setAiGenLoading] = useState(false);
    const [aiGenError, setAiGenError] = useState("");

        const loadTools = async () => {
        setLoading(true);
        try { setTools(await api.listCustomTools()); } finally { setLoading(false); }
    };

    useEffect(() => { 
        loadTools(); 
        api.getConfig().then(c => setConfig(c || {}));
    }, []);

    useEffect(() => {
        if (activeAiTool) {
            api.onAiModifyLog((text: string) => {
                setAiLogs(prev => [...prev, text]);
            });
        } else {
            api.offAiModifyLog();
        }
        return () => {
            api.offAiModifyLog();
        };
    }, [activeAiTool]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [aiLogs]);

    const handleExplain = async () => {
        if (!activeAiTool) return;
        setAiLoading(true);
        setAiError("");
        setAiExplanation("");
        setAiMode("explain");
        try {
            const res = await api.aiExplainTool(activeAiTool.name, activeAiTool.isCustom);
            if (res.success) {
                setAiExplanation(res.explanation);
            } else {
                setAiError(res.error || "Failed to generate explanation");
            }
        } catch (err: any) {
            console.error("Gaki CustomTools: Explain error:", err);
            setAiError(err.message || String(err));
        } finally {
            setAiLoading(false);
        }
    };

    const handleModifySubmit = async () => {
        if (!activeAiTool || !aiInput.trim()) return;
        setAiLoading(true);
        setAiError("");
        setAiLogs([]);
        setAiDiff("");
        setDiffApproved(false);
        setAiMode("modify");
        try {
            if (activeAiTool.isCustom) {
                const toolObj = tools.find(t => t.name === activeAiTool.name);
                const promptDetails = {
                    name: activeAiTool.name,
                    prompt: `Modify the existing custom tool code based on: ${aiInput}`,
                    parameters: toolObj?.parameters || [],
                    apiUrl: "",
                    expectedOutput: "Modified tool schema and JavaScript code",
                };
                const res = await api.aiGenerateCustomTool(promptDetails);
                if (res.success) {
                    const updateRes = await api.updateCustomTool(toolObj!.id, res.tool);
                    if (updateRes.success) {
                        setAiLogs([
                            "🧠 GeneratorAgent parsing modification request...",
                            "⚙️ Implementing Javascript enhancements...",
                            `✅ Custom tool "${activeAiTool.name}" updated successfully!`
                        ]);
                        await loadTools();
                    } else {
                        setAiError(updateRes.error || "Failed to update custom tool");
                    }
                } else {
                    setAiError(res.error || "Failed to modify custom tool");
                }
            } else {
                const res = await api.aiModifyBuiltinTool(activeAiTool.name, aiInput);
                if (res.success) {
                    const diffRes = await api.getGitDiff(activeAiTool.sourceFile || "");
                    if (diffRes.success) {
                        setAiDiff(diffRes.diff);
                    } else {
                        setAiError("Changes applied, but failed to fetch git diff: " + diffRes.error);
                    }
                } else {
                    setAiError(res.error || "Multi-agent modification failed.");
                }
            }
        } catch (err: any) {
            console.error("Gaki CustomTools: Modify error:", err);
            setAiError(err.message || String(err));
        } finally {
            setAiLoading(false);
        }
    };

    const handleApproveDiff = () => {
        setDiffApproved(true);
        setAiLogs(prev => [...prev, "🤝 Human Approved. Changes saved to workspace!"]);
    };

    const handleRejectDiff = async () => {
        if (!activeAiTool) return;
        try {
            await api.discardGitChanges(activeAiTool.sourceFile || "");
            setAiLogs(prev => [...prev, "❌ Human Rejected. Changes rolled back!"]);
            setAiDiff("");
        } catch (err: any) {
            console.error("Gaki CustomTools: Discard changes error:", err);
            setAiError("Failed to discard changes: " + err.message);
        }
    };

    const handleViewSource = async () => {
        if (!activeAiTool) return;
        setAiLoading(true);
        setAiError("");
        setAiMode("view_file");
        try {
            const res = await api.readToolSource(activeAiTool.name, activeAiTool.isCustom);
            if (res.success) {
                setToolFileContent(res.content);
            } else {
                setAiError(res.error || "Failed to read source file");
            }
        } catch (err: any) {
            console.error("Gaki CustomTools: View source error:", err);
            setAiError(err.message || String(err));
        } finally {
            setAiLoading(false);
        }
    };

    const handleAiGenCustomTool = async () => {
        if (!aiGenForm.prompt.trim()) return;
        setAiGenLoading(true);
        setAiGenError("");
        try {
            const res = await api.aiGenerateCustomTool(aiGenForm);
            if (res.success) {
                setForm({
                    name: res.tool.name,
                    description: res.tool.description,
                    parameters: res.tool.parameters || [],
                    code: res.tool.code
                });
                setShowAiGen(false);
                setShowCreate(true);
                setEditingId(null);
            } else {
                setAiGenError(res.error || "Failed to generate custom tool");
            }
        } catch (err: any) {
            console.error("Gaki CustomTools: AI Generation error:", err);
            setAiGenError(err.message || String(err));
        } finally {
            setAiGenLoading(false);
        }
    };

    const resetForm = () => setForm({ name: "", description: "", parameters: [], code: DEFAULT_CODE });

    const handleSave = async () => {
        setError("");
        if (!form.name.trim() || !form.description.trim()) { setError("Name and description are required."); return; }
        try {
            const res = editingId
                ? await api.updateCustomTool(editingId, form)
                : await api.createCustomTool(form);
            if (!res.success) { setError(res.error || "Failed to save"); return; }
            resetForm(); setShowCreate(false); setEditingId(null); await loadTools();
        } catch (e: any) {
            console.error("Gaki CustomTools: Save tool error:", e);
            setError(e.message || String(e));
        }
    };

    const handleEdit = (tool: CustomTool) => {
        setForm({ name: tool.name, description: tool.description, parameters: tool.parameters, code: tool.code });
        setEditingId(tool.id); setShowCreate(true); setExpandedId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this custom tool?")) return;
        await api.deleteCustomTool(id); await loadTools();
    };

    const handleRun = async (tool: CustomTool) => {
        setRunningId(tool.id);
        try {
            const parsedArgs: Record<string, any> = {};
            for (const p of tool.parameters) {
                const raw = runArgs[`${tool.id}:${p.name}`] ?? "";
                if (p.type === "number") parsedArgs[p.name] = Number(raw);
                else if (p.type === "boolean") parsedArgs[p.name] = raw === "true";
                else parsedArgs[p.name] = raw;
            }
            const result = await api.runCustomTool(tool.name, parsedArgs);
            setRunResults((prev) => ({ ...prev, [tool.id]: result }));
        } catch (e: any) {
            console.error("Gaki CustomTools: Run tool error:", e);
            setRunResults((prev) => ({ ...prev, [tool.id]: { success: false, error: e.message || String(e) } }));
        } finally {
            setRunningId(null);
        }
    };

    const addParam = () => setForm((f) => ({ ...f, parameters: [...f.parameters, { name: "", type: "string", description: "", required: true }] }));
    const updateParam = (idx: number, updates: Partial<ToolParam>) =>
        setForm((f) => ({ ...f, parameters: f.parameters.map((p, i) => i === idx ? { ...p, ...updates } : p) }));
    const removeParam = (idx: number) => setForm((f) => ({ ...f, parameters: f.parameters.filter((_, i) => i !== idx) }));

    return (
        <div style={{ maxWidth: "960px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Wrench size={22} color="var(--primary)" /> Custom Tools Studio
                    </h1>
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "560px" }}>
                        Write and register custom JavaScript tools. The AI agent will discover and call them during conversations.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                    <button onClick={loadTools} style={iconBtnStyle} title="Refresh tools list"><RefreshCw size={15} /></button>
                    <button 
                        onClick={() => { 
                            setAiGenForm({ prompt: "", name: "", parameters: [], apiUrl: "", expectedOutput: "" }); 
                            setAiGenError(""); 
                            setShowAiGen(true); 
                        }} 
                        className="glow-btn" 
                        style={{ ...primaryBtnStyle, background: "linear-gradient(135deg, rgba(99,102,241,0.8), rgba(168,85,247,0.8))", border: "1px solid rgba(168,85,247,0.4)" }} 
                        title="Generate a custom tool using AI"
                    >
                        <Sparkles size={15} /> Generate with AI
                    </button>
                    <button onClick={() => { resetForm(); setEditingId(null); setShowCreate(!showCreate); setError(""); }} className="glow-btn" style={primaryBtnStyle} title="Create a new custom tool">
                        <Plus size={15} /> New Tool
                    </button>
                </div>
            </div>

            {/* Create / Edit Form */}
            {showCreate && (
                <div style={{ ...cardStyle, marginBottom: "24px" }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {editingId ? "✏️ Edit Tool" : "🔧 Create New Tool"}
                    </h3>
                    {error && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                <AlertCircle size={14} /> <span>{error}</span>
                            </div>
                            <CopyButton text={error} />
                        </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <label style={labelStyle}>Tool Name <span style={{ color: "rgba(148,163,184,0.4)", fontWeight: 400 }}>(snake_case)</span></label>
                            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. format_json" style={inputStyle} disabled={!!editingId} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this tool do?" style={inputStyle} />
                        </div>
                    </div>

                    {/* Parameters */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Parameters</label>
                            <button onClick={addParam} style={{ ...iconBtnStyle, fontSize: "12px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }} title="Add a new parameter to this tool">
                                <Plus size={12} /> Add Param
                            </button>
                        </div>
                        {form.parameters.length === 0 && (
                            <div style={{ color: "rgba(148,163,184,0.35)", fontSize: "12px", padding: "6px 0" }}>No parameters — tool will be called with empty args.</div>
                        )}
                        {form.parameters.map((p, idx) => (
                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 2fr auto auto", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                                <input value={p.name} onChange={(e) => updateParam(idx, { name: e.target.value })} placeholder="param_name" style={{ ...inputStyle, fontSize: "12px", padding: "7px 10px" }} />
                                <select value={p.type} onChange={(e) => updateParam(idx, { type: e.target.value as any })} style={{ ...inputStyle, fontSize: "12px", padding: "7px 10px" }}>
                                    <option value="string">string</option>
                                    <option value="number">number</option>
                                    <option value="boolean">boolean</option>
                                </select>
                                <input value={p.description} onChange={(e) => updateParam(idx, { description: e.target.value })} placeholder="Description" style={{ ...inputStyle, fontSize: "12px", padding: "7px 10px" }} />
                                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap" }} title="Is this parameter required?">
                                    <input type="checkbox" checked={p.required} onChange={(e) => updateParam(idx, { required: e.target.checked })} style={{ accentColor: "var(--primary)" }} />
                                    Req
                                </label>
                                <button onClick={() => removeParam(idx)} style={{ ...iconBtnStyle, color: "var(--error)", padding: "7px" }} title="Remove parameter"><X size={13} /></button>
                            </div>
                        ))}
                    </div>

                    {/* Code Editor */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                <Code2 size={13} /> JavaScript Code
                            </label>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {TEMPLATES.map((t) => (
                                    <button key={t.label} onClick={() => setForm((f) => ({ ...f, code: t.code }))} style={{ ...iconBtnStyle, fontSize: "11px", padding: "3px 8px" }} title={`Load ${t.label} template`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={form.code}
                            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                            rows={10}
                            style={{ ...inputStyle, fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: "12px", resize: "vertical", lineHeight: 1.6 }}
                            spellCheck={false}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }} style={secondaryBtnStyle}>Cancel</button>
                        <button onClick={handleSave} className="glow-btn" style={primaryBtnStyle}><Save size={14} /> {editingId ? "Save Changes" : "Create Tool"}</button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                <button 
                    onClick={() => setActiveTab("custom")} 
                    style={{
                        background: "none",
                        border: "none",
                        color: activeTab === "custom" ? "var(--primary)" : "var(--text-muted)",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        paddingBottom: "8px",
                        borderBottom: activeTab === "custom" ? "2px solid var(--primary)" : "none",
                        transition: "all 0.2s"
                    }}
                >
                    Custom Studio Tools ({tools.length})
                </button>
                <button 
                    onClick={() => setActiveTab("builtin")} 
                    style={{
                        background: "none",
                        border: "none",
                        color: activeTab === "builtin" ? "var(--primary)" : "var(--text-muted)",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        paddingBottom: "8px",
                        borderBottom: activeTab === "builtin" ? "2px solid var(--primary)" : "none",
                        transition: "all 0.2s"
                    }}
                >
                    Built-in Workspace Tools ({BUILTIN_TOOLS.length})
                </button>
            </div>

            {/* Tools List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading tools...</div>
            ) : activeTab === "custom" ? (
                tools.length === 0 ? (
                    <div style={{ ...cardStyle, textAlign: "center", padding: "52px" }}>
                        <Wrench size={42} color="rgba(99,102,241,0.25)" style={{ marginBottom: "14px" }} />
                        <p style={{ color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>No custom tools yet</p>
                        <p style={{ color: "rgba(148,163,184,0.4)", margin: "4px 0 0", fontSize: "12px" }}>Click "New Tool" to create your first custom JavaScript tool.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {tools.map((tool) => (
                            <div key={tool.id} style={cardStyle}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "9px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Wrench size={18} color="var(--primary)" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", fontFamily: "monospace" }}>{tool.name}</div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{tool.description}</div>
                                            <div style={{ display: "flex", gap: "5px", marginTop: "6px", flexWrap: "wrap" }}>
                                                {tool.parameters.map((p) => (
                                                    <span key={p.name} style={{ fontSize: "10px", padding: "2px 7px", background: "rgba(99,102,241,0.1)", borderRadius: "6px", color: "rgba(148,163,184,0.75)", fontFamily: "monospace" }}>
                                                        {p.name}: {p.type}
                                                    </span>
                                                ))}
                                                {tool.parameters.length === 0 && <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.35)" }}>no params</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", flexShrink: 0, marginLeft: "12px" }}>
                                        <button 
                                            onClick={() => {
                                                setActiveAiTool({ name: tool.name, isCustom: true });
                                                setAiMode("menu");
                                                setAiInput("");
                                                setAiError("");
                                                setAiLogs([]);
                                                setAiDiff("");
                                                setToolFileContent("");
                                                setAiExplanation("");
                                            }} 
                                            style={{ ...iconBtnStyle, background: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.2)", color: "var(--secondary)" }} 
                                            title="Ask AI Assistant about this tool"
                                        >
                                            <Sparkles size={15} />
                                        </button>
                                        <button onClick={() => setExpandedId(expandedId === tool.id ? null : tool.id)} style={iconBtnStyle} title={expandedId === tool.id ? "Collapse runner" : "Expand runner"}>
                                            {expandedId === tool.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>
                                        <button onClick={() => handleEdit(tool)} style={iconBtnStyle} title="Edit tool"><Pencil size={15} /></button>
                                        <button onClick={() => handleDelete(tool.id)} style={{ ...iconBtnStyle, color: "var(--error)" }} title="Delete tool"><Trash2 size={15} /></button>
                                    </div>
                                </div>

                                {/* Expanded Run Panel */}
                                {expandedId === tool.id && (
                                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
                                        {/* Code Implementation Preview */}
                                        <div style={{ marginBottom: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>📄 JavaScript Code Implementation:</span>
                                                <CopyButton text={tool.code} />
                                            </div>
                                            <pre style={{ 
                                                margin: 0, 
                                                fontSize: "11.5px", 
                                                color: "rgba(203,213,225,0.85)", 
                                                fontFamily: "monospace", 
                                                whiteSpace: "pre-wrap", 
                                                wordBreak: "break-word",
                                                background: "rgba(5, 5, 20, 0.45)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "6px",
                                                padding: "10px"
                                            }}>
                                                {tool.code}
                                            </pre>
                                        </div>

                                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>🧪 Run Tool Runner:</div>

                                        {tool.parameters.length > 0 && (
                                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                                                {tool.parameters.map((p) => (
                                                    <div key={p.name} style={{ flex: "1", minWidth: "160px" }}>
                                                        <label style={labelStyle}>{p.name} <span style={{ color: "rgba(148,163,184,0.4)" }}>({p.type})</span></label>
                                                        <input
                                                            value={runArgs[`${tool.id}:${p.name}`] ?? ""}
                                                            onChange={(e) => setRunArgs((prev) => ({ ...prev, [`${tool.id}:${p.name}`]: e.target.value }))}
                                                            placeholder={`Enter ${p.name}...`}
                                                            style={{ ...inputStyle, fontSize: "12px" }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={() => handleRun(tool)} disabled={runningId === tool.id} className="glow-btn" style={primaryBtnStyle}>
                                            <Play size={13} /> {runningId === tool.id ? "Running..." : "Run Tool"}
                                        </button>

                                        {/* Result */}
                                        {runResults[tool.id] && (
                                            <div style={{ marginTop: "12px", background: "rgba(5,5,20,0.85)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", padding: "14px" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        {runResults[tool.id].success
                                                            ? <CheckCircle2 size={13} color="#34d399" />
                                                            : <AlertCircle size={13} color="#f87171" />}
                                                        <span style={{ fontSize: "12px", fontWeight: 600, color: runResults[tool.id].success ? "#34d399" : "#f87171" }}>
                                                            {runResults[tool.id].success ? "Success" : "Error"}
                                                        </span>
                                                    </div>
                                                    <CopyButton text={JSON.stringify(runResults[tool.id].output ?? runResults[tool.id].error, null, 2)} />
                                                </div>
                                                <pre style={{ margin: 0, fontSize: "12px", color: "rgba(203,213,225,0.85)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    {JSON.stringify(runResults[tool.id].output ?? runResults[tool.id].error, null, 2)}
                                                </pre>
                                                {runResults[tool.id].logs?.length > 0 && (
                                                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
                                                        <div style={{ fontSize: "11px", color: "rgba(148,163,184,0.45)", marginBottom: "5px" }}>Console output:</div>
                                                        {runResults[tool.id].logs.map((l: string, i: number) => (
                                                            <div key={i} style={{ fontSize: "11px", color: "rgba(148,163,184,0.65)", fontFamily: "monospace" }}>{l}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {BUILTIN_TOOLS.map((tool) => {
                        const isConfigured = !tool.requiredConfigKeys || tool.requiredConfigKeys.every(k => !!config[k]);
                        const isExpanded = expandedBuiltin === tool.name;
                        return (
                            <div key={tool.name} style={cardStyle}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "9px", background: "rgba(148,163,184,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Wrench size={18} color="var(--text-secondary)" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", fontFamily: "monospace" }}>{tool.name}</span>
                                                <span style={{ 
                                                    fontSize: "10px", 
                                                    padding: "2px 6px", 
                                                    background: isConfigured ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)", 
                                                    color: isConfigured ? "#34d399" : "#fbbf24", 
                                                    borderRadius: "4px",
                                                    fontWeight: 500
                                                }}>
                                                    {isConfigured ? "Ready" : "Needs Config"}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{tool.description}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", flexShrink: 0, marginLeft: "12px" }}>
                                        <button 
                                            onClick={() => {
                                                setActiveAiTool({ name: tool.name, isCustom: false, sourceFile: tool.sourceFile });
                                                setAiMode("menu");
                                                setAiInput("");
                                                setAiError("");
                                                setAiLogs([]);
                                                setAiDiff("");
                                                setToolFileContent("");
                                                setAiExplanation("");
                                            }} 
                                            style={{ ...iconBtnStyle, background: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.2)", color: "var(--secondary)" }} 
                                            title="Ask AI Assistant about this tool"
                                        >
                                            <Sparkles size={15} />
                                        </button>
                                        <button 
                                            onClick={() => setExpandedBuiltin(isExpanded ? null : tool.name)} 
                                            style={iconBtnStyle} 
                                            title={isExpanded ? "Hide details" : "Show details"}
                                        >
                                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Collapsible drawer for Built-in Tool details */}
                                {isExpanded && (
                                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "14px" }}>
                                        {/* Parameters */}
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>📋 Parameters:</div>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                                {tool.parameters.map((p) => (
                                                    <span key={p.name} style={{ fontSize: "10.5px", padding: "3px 8px", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                                        {p.name}{p.required ? "*" : ""}: <span style={{ color: "var(--primary)" }}>{p.type}</span> — {p.description}
                                                    </span>
                                                ))}
                                                {tool.parameters.length === 0 && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>None (takes no arguments)</span>}
                                            </div>
                                        </div>

                                        {/* Agent Usage */}
                                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>🤖 Agent Usage:</div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>{tool.agentUsage}</div>
                                        </div>

                                        {/* How to Use / Prompt Trigger */}
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>💬 How to Use:</div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "6px" }}>{tool.howToUse}</div>
                                        </div>

                                        {/* How to Configure */}
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>⚙️ How to Configure:</div>
                                            {tool.requiredConfigKeys && tool.requiredConfigKeys.length > 0 ? (
                                                <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                                    Requires the following variables in your <code style={{ fontFamily: "monospace", color: "var(--primary)" }}>.env</code> file:
                                                    <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                                                        {tool.requiredConfigKeys.map(key => {
                                                            const isSet = !!config[key];
                                                            return (
                                                                <li key={key} style={{ color: isSet ? "var(--text-muted)" : "#fbbf24", display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                                                                    <span style={{ fontSize: "12px", color: isSet ? "var(--success)" : "#fbbf24" }}>{isSet ? "✓" : "⚠"}</span>
                                                                    <strong style={{ fontFamily: "monospace" }}>{key}</strong>
                                                                    {ENV_TOOLTIPS[key] && (
                                                                        <Tooltip content={ENV_TOOLTIPS[key]}>
                                                                            <HelpCircle size={12} style={{ color: "var(--primary)", cursor: "pointer", marginLeft: "4px" }} />
                                                                        </Tooltip>
                                                                    )}
                                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>
                                                                        ({isSet ? "Configured" : "Missing key"})
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                    To edit these variables, navigate to the <strong>Settings</strong> page or edit the file at:
                                                    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)", background: "var(--bg-deep)", padding: "4px 8px", borderRadius: "4px", marginTop: "4px", display: "inline-block" }}>
                                                        .env (in workspace root)
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>This tool runs instantly and requires no special environment credentials.</div>
                                            )}
                                        </div>

                                        {/* How to Modify */}
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>💻 How to Modify:</div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                                                {tool.howToModify} The implementation code is located in your workspace:
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                                                    <span style={{ fontSize: "11px", fontFamily: "monospace", background: "var(--bg-deep)", border: "1px solid var(--border)", padding: "6px 10px", borderRadius: "6px", color: "var(--text-primary)", flex: 1 }}>
                                                        {tool.sourceFile}
                                                    </span>
                                                    <CopyButton text={tool.sourceFile} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* AI Tool Assistant Side Drawer */}
            {activeAiTool && (
                <>
                    {/* Backdrop overlay */}
                    <div 
                        onClick={() => setActiveAiTool(null)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0, 0, 0, 0.4)",
                            backdropFilter: "blur(4px)",
                            zIndex: 1000,
                            transition: "opacity 0.3s"
                        }}
                    />
                    {/* Drawer container */}
                    <div style={{
                        position: "fixed",
                        top: 0,
                        right: 0,
                        width: "480px",
                        height: "100vh",
                        background: "var(--bg-surface)",
                        borderLeft: "1px solid var(--border)",
                        boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)",
                        zIndex: 1001,
                        display: "flex",
                        flexDirection: "column",
                        animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                    }}>
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes slideIn {
                                from { transform: translateX(100%); }
                                to { transform: translateX(0); }
                            }
                        `}} />
                        
                        {/* Header */}
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(255,255,255,0.01)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Sparkles size={18} color="var(--primary)" />
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                                        AI Assistant
                                    </h2>
                                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                        {activeAiTool.isCustom ? "Custom Tool" : "Built-in Tool"}: {activeAiTool.name}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveAiTool(null)}
                                style={{ ...iconBtnStyle, padding: "6px", border: "none", background: "transparent" }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Tabs inside drawer menu or current state */}
                        {aiMode === "menu" ? (
                            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" }}>
                                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 10px" }}>
                                    Select an AI action for <strong style={{ color: "var(--text-primary)" }}>{activeAiTool.name}</strong>:
                                </p>
                                
                                <button 
                                    onClick={handleExplain}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "16px",
                                        borderRadius: "10px",
                                        background: "rgba(255, 255, 255, 0.02)",
                                        border: "1px solid var(--border)",
                                        color: "var(--text-primary)",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--primary)";
                                        e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                                    }}
                                >
                                    <HelpCircle size={20} color="var(--primary)" />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "14px" }}>Explain Tool</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            Generate details, parameters, examples, and agent usage guides.
                                        </div>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => setAiMode("modify")}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "16px",
                                        borderRadius: "10px",
                                        background: "rgba(255, 255, 255, 0.02)",
                                        border: "1px solid var(--border)",
                                        color: "var(--text-primary)",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--secondary)";
                                        e.currentTarget.style.background = "rgba(168, 85, 247, 0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                                    }}
                                >
                                    <Hammer size={20} color="var(--secondary)" />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "14px" }}>Modify Tool</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            {activeAiTool.isCustom 
                                                ? "Regenerate JS code using prompt instructions."
                                                : "Run multi-agent pipeline to edit tool source file (git diff verification)."}
                                        </div>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={handleViewSource}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "16px",
                                        borderRadius: "10px",
                                        background: "rgba(255, 255, 255, 0.02)",
                                        border: "1px solid var(--border)",
                                        color: "var(--text-primary)",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--accent)";
                                        e.currentTarget.style.background = "rgba(236, 72, 153, 0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                                    }}
                                >
                                    <FileText size={20} color="var(--accent)" />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "14px" }}>View Source File</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            View read-only tool source code directly in the assistant.
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "calc(100vh - 81px)", overflowY: "auto", padding: "20px 24px" }}>
                                {/* Navigation Back */}
                                <button 
                                    onClick={() => {
                                        setAiMode("menu");
                                        setAiError("");
                                        setAiExplanation("");
                                        setAiLogs([]);
                                        setAiDiff("");
                                        setToolFileContent("");
                                    }}
                                    style={{
                                        alignSelf: "flex-start",
                                        background: "none",
                                        border: "none",
                                        color: "var(--primary)",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        marginBottom: "16px",
                                        padding: 0
                                    }}
                                >
                                    ← Back to Menu
                                </button>
                                
                                {/* EXPLAIN MODE */}
                                {aiMode === "explain" && (
                                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                                            🧠 AI Tool Explanation
                                        </h3>
                                        {aiLoading ? (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "40px 0", color: "var(--text-muted)" }}>
                                                <Loader2 size={24} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                                                <span>Generating explanation...</span>
                                            </div>
                                        ) : aiError ? (
                                            <div style={{ color: "#f87171", fontSize: "13px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                                    <AlertCircle size={14} /> <span>{aiError}</span>
                                                </div>
                                                <CopyButton text={aiError} />
                                            </div>
                                        ) : (
                                            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                                                <MarkdownViewer text={aiExplanation} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* VIEW FILE MODE */}
                                {aiMode === "view_file" && (
                                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                                            📄 Source Code Viewer
                                        </h3>
                                        {aiLoading ? (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "40px 0", color: "var(--text-muted)" }}>
                                                <Loader2 size={24} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                                                <span>Reading file content...</span>
                                            </div>
                                        ) : aiError ? (
                                            <div style={{ color: "#f87171", fontSize: "13px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                                    <AlertCircle size={14} /> <span>{aiError}</span>
                                                </div>
                                                <CopyButton text={aiError} />
                                            </div>
                                        ) : (
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                                                <pre style={{ 
                                                    margin: 0, 
                                                    fontSize: "11px", 
                                                    color: "rgba(203,213,225,0.9)", 
                                                    fontFamily: "monospace", 
                                                    whiteSpace: "pre-wrap", 
                                                    wordBreak: "break-word",
                                                    background: "rgba(5, 5, 20, 0.75)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "6px",
                                                    padding: "12px",
                                                    flex: 1,
                                                    overflow: "auto"
                                                }}>
                                                    {toolFileContent}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* MODIFY MODE */}
                                {aiMode === "modify" && (
                                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                        <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                                            🔨 Modify Tool code with AI
                                        </h3>
                                        <p style={{ margin: "0 0 14px", fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                            {activeAiTool.isCustom 
                                                ? "Describe code updates. The AI Generator will update and reload the custom tool schema."
                                                : "Describe your changes (e.g. add validation, error logging). Gaki's Orchestrator agent will edit the tool source file, run compile and testing checks, and stream the progress below."
                                            }
                                        </p>
                                        
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                            <input 
                                                value={aiInput} 
                                                onChange={(e) => setAiInput(e.target.value)} 
                                                placeholder="e.g. Add logging when command starts execution" 
                                                style={{ ...inputStyle, flex: 1 }}
                                                disabled={aiLoading}
                                            />
                                            <button 
                                                onClick={handleModifySubmit}
                                                disabled={aiLoading || !aiInput.trim()}
                                                className="glow-btn"
                                                style={{ ...primaryBtnStyle, padding: "8px 16px" }}
                                            >
                                                {aiLoading ? "Working..." : "Run AI"}
                                            </button>
                                        </div>
                                        
                                        {/* Live Agent Logs Stream */}
                                        {(aiLogs.length > 0 || aiLoading) && (
                                            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "220px", marginBottom: "16px" }}>
                                                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                                                    🤖 Execution Log Stream:
                                                </div>
                                                <div style={{ 
                                                    background: "rgba(5, 5, 20, 0.85)", 
                                                    border: "1px solid var(--border)", 
                                                    borderRadius: "6px", 
                                                    padding: "12px", 
                                                    flex: 1, 
                                                    overflowY: "auto",
                                                    fontFamily: "monospace",
                                                    fontSize: "11px",
                                                    lineHeight: "1.5",
                                                    color: "#38bdf8"
                                                }}>
                                                    {aiLogs.map((log, index) => (
                                                        <div key={index} style={{ marginBottom: "4px", whiteSpace: "pre-wrap" }}>{log}</div>
                                                    ))}
                                                    {aiLoading && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginTop: "4px" }}>
                                                            <Loader2 size={11} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                                                            <span>Agent pipeline executing commands...</span>
                                                        </div>
                                                    )}
                                                    <div ref={logsEndRef} />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Error View */}
                                        {aiError && (
                                            <div style={{ color: "#f87171", fontSize: "13px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                                    <AlertCircle size={14} /> <span>{aiError}</span>
                                                </div>
                                                <CopyButton text={aiError} />
                                            </div>
                                        )}
                                        
                                        {/* Git Diff Review & Approval Section */}
                                        {!activeAiTool.isCustom && aiDiff && (
                                            <div style={{ display: "flex", flexDirection: "column", minHeight: "240px" }}>
                                                <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                                                    🔍 Review Code Modifications (Git Diff):
                                                </div>
                                                <pre style={{ 
                                                    margin: "0 0 16px", 
                                                    fontSize: "11px", 
                                                    color: "rgba(203,213,225,0.9)", 
                                                    fontFamily: "monospace", 
                                                    whiteSpace: "pre-wrap", 
                                                    wordBreak: "break-word",
                                                    background: "rgba(5, 5, 20, 0.75)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "6px",
                                                    padding: "12px",
                                                    maxHeight: "300px",
                                                    overflow: "auto",
                                                }}>
                                                    {aiDiff.split("\n").map((line, i) => {
                                                        const isAdd = line.startsWith("+") && !line.startsWith("+++");
                                                        const isDel = line.startsWith("-") && !line.startsWith("---");
                                                        const color = isAdd ? "#34d399" : isDel ? "#f87171" : "inherit";
                                                        const bg = isAdd ? "rgba(52,211,153,0.08)" : isDel ? "rgba(248,113,113,0.08)" : "transparent";
                                                        return (
                                                            <div key={i} style={{ color, background: bg, padding: "1px 4px" }}>{line}</div>
                                                        );
                                                    })}
                                                </pre>
                                                
                                                {!diffApproved ? (
                                                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                                        <button onClick={handleRejectDiff} style={{ ...secondaryBtnStyle, color: "var(--error)", borderColor: "rgba(239,68,68,0.3)" }}>
                                                            Discard Changes
                                                        </button>
                                                        <button onClick={handleApproveDiff} className="glow-btn" style={{ ...primaryBtnStyle, background: "var(--success)" }}>
                                                            Approve & Merge
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
                                                        <CheckCircle2 size={16} /> Changes successfully approved and applied!
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* AI Generator Questionnaire Modal */}
            {showAiGen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        width: "560px",
                        maxHeight: "85vh",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                        display: "flex",
                        flexDirection: "column",
                        animation: "modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                    }}>
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes modalFadeIn {
                                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                        `}} />
                        
                        {/* Header */}
                        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Sparkles size={18} color="var(--primary)" />
                                <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>Generate Tool with AI</span>
                            </div>
                            <button onClick={() => setShowAiGen(false)} style={{ ...iconBtnStyle, padding: "5px", border: "none", background: "transparent" }}>
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                            {aiGenError && (
                                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                        <AlertCircle size={14} /> <span>{aiGenError}</span>
                                    </div>
                                    <CopyButton text={aiGenError} />
                                </div>
                            )}
                            
                            {/* Prompt Description */}
                            <div>
                                <label style={labelStyle}>What should the custom tool do? *</label>
                                <textarea 
                                    value={aiGenForm.prompt}
                                    onChange={(e) => setAiGenForm(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder="e.g. Fetch weather metrics from Open-Meteo for a given city name..."
                                    rows={3}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                    required
                                />
                            </div>
                            
                            {/* Proposed Tool Name */}
                            <div>
                                <label style={labelStyle}>Proposed Tool Name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(snake_case)</span></label>
                                <input 
                                    value={aiGenForm.name}
                                    onChange={(e) => setAiGenForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. fetch_weather"
                                    style={inputStyle}
                                />
                            </div>
                            
                            {/* Does it need an API URL */}
                            <div>
                                <label style={labelStyle}>External API URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                                <input 
                                    value={aiGenForm.apiUrl}
                                    onChange={(e) => setAiGenForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                                    placeholder="e.g. https://api.open-meteo.com/v1/forecast"
                                    style={inputStyle}
                                />
                            </div>
                            
                            {/* Expected Output */}
                            <div>
                                <label style={labelStyle}>What is the expected output? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                                <input 
                                    value={aiGenForm.expectedOutput}
                                    onChange={(e) => setAiGenForm(prev => ({ ...prev, expectedOutput: e.target.value }))}
                                    placeholder="e.g. A JSON object with temperature and windspeed fields"
                                    style={inputStyle}
                                />
                            </div>
                            
                            {/* Parameters list */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>Proposed Parameters</label>
                                    <button 
                                        onClick={() => setAiGenForm(prev => ({ 
                                            ...prev, 
                                            parameters: [...prev.parameters, { name: "", type: "string", description: "", required: true }] 
                                        }))} 
                                        style={{ ...iconBtnStyle, fontSize: "11px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                                    >
                                        <Plus size={10} /> Add Param
                                    </button>
                                </div>
                                {aiGenForm.parameters.length === 0 && (
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "4px 0" }}>
                                        No parameters specified. AI will infer necessary parameters based on prompt.
                                    </div>
                                )}
                                {aiGenForm.parameters.map((p, idx) => (
                                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1.5fr auto auto", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
                                        <input 
                                            value={p.name} 
                                            onChange={(e) => {
                                                const updated = [...aiGenForm.parameters];
                                                updated[idx].name = e.target.value;
                                                setAiGenForm(prev => ({ ...prev, parameters: updated }));
                                            }} 
                                            placeholder="name" 
                                            style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }} 
                                        />
                                        <select 
                                            value={p.type} 
                                            onChange={(e) => {
                                                const updated = [...aiGenForm.parameters];
                                                updated[idx].type = e.target.value as any;
                                                setAiGenForm(prev => ({ ...prev, parameters: updated }));
                                            }} 
                                            style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }}
                                        >
                                            <option value="string">string</option>
                                            <option value="number">number</option>
                                            <option value="boolean">boolean</option>
                                        </select>
                                        <input 
                                            value={p.description} 
                                            onChange={(e) => {
                                                const updated = [...aiGenForm.parameters];
                                                updated[idx].description = e.target.value;
                                                setAiGenForm(prev => ({ ...prev, parameters: updated }));
                                            }} 
                                            placeholder="Description" 
                                            style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }} 
                                        />
                                        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            <input 
                                                type="checkbox" 
                                                checked={p.required} 
                                                onChange={(e) => {
                                                    const updated = [...aiGenForm.parameters];
                                                    updated[idx].required = e.target.checked;
                                                    setAiGenForm(prev => ({ ...prev, parameters: updated }));
                                                }} 
                                                style={{ accentColor: "var(--primary)" }} 
                                            />
                                            Req
                                         </label>
                                        <button 
                                            onClick={() => {
                                                const updated = aiGenForm.parameters.filter((_, i) => i !== idx);
                                                setAiGenForm(prev => ({ ...prev, parameters: updated }));
                                            }} 
                                            style={{ ...iconBtnStyle, color: "var(--error)", padding: "6px" }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", justifyContent: "flex-end", background: "rgba(255,255,255,0.01)" }}>
                            <button onClick={() => setShowAiGen(false)} style={secondaryBtnStyle} disabled={aiGenLoading}>Cancel</button>
                            <button 
                                onClick={handleAiGenCustomTool} 
                                disabled={aiGenLoading || !aiGenForm.prompt.trim()} 
                                className="glow-btn" 
                                style={primaryBtnStyle}
                            >
                                {aiGenLoading ? (
                                    <>
                                        <Loader2 size={13} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={13} />
                                        Generate Code
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const cardStyle: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", backdropFilter: "blur(10px)" };
const primaryBtnStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const secondaryBtnStyle: React.CSSProperties = { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" };
const iconBtnStyle: React.CSSProperties = { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)", fontSize: "13px", outline: "none", fontFamily: "inherit" };
