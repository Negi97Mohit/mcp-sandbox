import React, { useState, useEffect } from "react";
import {
    Wrench, Plus, Trash2, Play, Code2, ChevronDown, ChevronUp,
    AlertCircle, CheckCircle2, RefreshCw, Pencil, Save, X, Copy,
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

    const loadTools = async () => {
        setLoading(true);
        try { setTools(await api.listCustomTools()); } finally { setLoading(false); }
    };

    useEffect(() => { loadTools(); }, []);

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
        } catch (e: any) { setError(e.message); }
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
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <AlertCircle size={14} /> {error}
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

            {/* Tools List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading tools...</div>
            ) : tools.length === 0 ? (
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
