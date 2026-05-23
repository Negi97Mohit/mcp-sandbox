import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { Wrench, Plus, Trash2, Play, Code2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, RefreshCw, Pencil, Save, X, Copy, } from "lucide-react";
import { api } from "../api/bridge.js";
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };
    return (_jsxs("button", { onClick: handleCopy, style: {
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
        }, title: "Copy to clipboard", onMouseEnter: (e) => {
            if (!copied)
                e.currentTarget.style.borderColor = "var(--primary)";
        }, onMouseLeave: (e) => {
            if (!copied)
                e.currentTarget.style.borderColor = "var(--border)";
        }, children: [copied ? _jsx(CheckCircle2, { size: 12, color: "var(--success)" }) : _jsx(Copy, { size: 12 }), _jsx("span", { children: copied ? "Copied!" : "Copy" })] }));
};
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
export const CustomTools = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [runningId, setRunningId] = useState(null);
    const [runArgs, setRunArgs] = useState({});
    const [runResults, setRunResults] = useState({});
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", description: "", parameters: [], code: DEFAULT_CODE });
    const loadTools = async () => {
        setLoading(true);
        try {
            setTools(await api.listCustomTools());
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadTools(); }, []);
    const resetForm = () => setForm({ name: "", description: "", parameters: [], code: DEFAULT_CODE });
    const handleSave = async () => {
        setError("");
        if (!form.name.trim() || !form.description.trim()) {
            setError("Name and description are required.");
            return;
        }
        try {
            const res = editingId
                ? await api.updateCustomTool(editingId, form)
                : await api.createCustomTool(form);
            if (!res.success) {
                setError(res.error || "Failed to save");
                return;
            }
            resetForm();
            setShowCreate(false);
            setEditingId(null);
            await loadTools();
        }
        catch (e) {
            setError(e.message);
        }
    };
    const handleEdit = (tool) => {
        setForm({ name: tool.name, description: tool.description, parameters: tool.parameters, code: tool.code });
        setEditingId(tool.id);
        setShowCreate(true);
        setExpandedId(null);
    };
    const handleDelete = async (id) => {
        if (!confirm("Delete this custom tool?"))
            return;
        await api.deleteCustomTool(id);
        await loadTools();
    };
    const handleRun = async (tool) => {
        setRunningId(tool.id);
        try {
            const parsedArgs = {};
            for (const p of tool.parameters) {
                const raw = runArgs[`${tool.id}:${p.name}`] ?? "";
                if (p.type === "number")
                    parsedArgs[p.name] = Number(raw);
                else if (p.type === "boolean")
                    parsedArgs[p.name] = raw === "true";
                else
                    parsedArgs[p.name] = raw;
            }
            const result = await api.runCustomTool(tool.name, parsedArgs);
            setRunResults((prev) => ({ ...prev, [tool.id]: result }));
        }
        finally {
            setRunningId(null);
        }
    };
    const addParam = () => setForm((f) => ({ ...f, parameters: [...f.parameters, { name: "", type: "string", description: "", required: true }] }));
    const updateParam = (idx, updates) => setForm((f) => ({ ...f, parameters: f.parameters.map((p, i) => i === idx ? { ...p, ...updates } : p) }));
    const removeParam = (idx) => setForm((f) => ({ ...f, parameters: f.parameters.filter((_, i) => i !== idx) }));
    return (_jsxs("div", { style: { maxWidth: "960px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }, children: [_jsxs("div", { children: [_jsxs("h1", { style: { margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx(Wrench, { size: 22, color: "var(--primary)" }), " Custom Tools Studio"] }), _jsx("p", { style: { margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "560px" }, children: "Write and register custom JavaScript tools. The AI agent will discover and call them during conversations." })] }), _jsxs("div", { style: { display: "flex", gap: "10px", flexShrink: 0 }, children: [_jsx("button", { onClick: loadTools, style: iconBtnStyle, children: _jsx(RefreshCw, { size: 15 }) }), _jsxs("button", { onClick: () => { resetForm(); setEditingId(null); setShowCreate(!showCreate); setError(""); }, style: primaryBtnStyle, children: [_jsx(Plus, { size: 15 }), " New Tool"] })] })] }), showCreate && (_jsxs("div", { style: { ...cardStyle, marginBottom: "24px" }, children: [_jsx("h3", { style: { margin: "0 0 20px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }, children: editingId ? "✏️ Edit Tool" : "🔧 Create New Tool" }), error && (_jsxs("div", { style: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(AlertCircle, { size: 14 }), " ", error] })), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "16px" }, children: [_jsxs("div", { children: [_jsxs("label", { style: labelStyle, children: ["Tool Name ", _jsx("span", { style: { color: "rgba(148,163,184,0.4)", fontWeight: 400 }, children: "(snake_case)" })] }), _jsx("input", { value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "e.g. format_json", style: inputStyle, disabled: !!editingId })] }), _jsxs("div", { children: [_jsx("label", { style: labelStyle, children: "Description" }), _jsx("input", { value: form.description, onChange: (e) => setForm((f) => ({ ...f, description: e.target.value })), placeholder: "What does this tool do?", style: inputStyle })] })] }), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }, children: [_jsx("label", { style: { ...labelStyle, marginBottom: 0 }, children: "Parameters" }), _jsxs("button", { onClick: addParam, style: { ...iconBtnStyle, fontSize: "12px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }, children: [_jsx(Plus, { size: 12 }), " Add Param"] })] }), form.parameters.length === 0 && (_jsx("div", { style: { color: "rgba(148,163,184,0.35)", fontSize: "12px", padding: "6px 0" }, children: "No parameters \u2014 tool will be called with empty args." })), form.parameters.map((p, idx) => (_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.5fr 1fr 2fr auto auto", gap: "8px", marginBottom: "8px", alignItems: "center" }, children: [_jsx("input", { value: p.name, onChange: (e) => updateParam(idx, { name: e.target.value }), placeholder: "param_name", style: { ...inputStyle, fontSize: "12px", padding: "7px 10px" } }), _jsxs("select", { value: p.type, onChange: (e) => updateParam(idx, { type: e.target.value }), style: { ...inputStyle, fontSize: "12px", padding: "7px 10px" }, children: [_jsx("option", { value: "string", children: "string" }), _jsx("option", { value: "number", children: "number" }), _jsx("option", { value: "boolean", children: "boolean" })] }), _jsx("input", { value: p.description, onChange: (e) => updateParam(idx, { description: e.target.value }), placeholder: "Description", style: { ...inputStyle, fontSize: "12px", padding: "7px 10px" } }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap" }, children: [_jsx("input", { type: "checkbox", checked: p.required, onChange: (e) => updateParam(idx, { required: e.target.checked }), style: { accentColor: "var(--primary)" } }), "Req"] }), _jsx("button", { onClick: () => removeParam(idx), style: { ...iconBtnStyle, color: "var(--error)", padding: "7px" }, children: _jsx(X, { size: 13 }) })] }, idx)))] }), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }, children: [_jsxs("label", { style: { ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }, children: [_jsx(Code2, { size: 13 }), " JavaScript Code"] }), _jsx("div", { style: { display: "flex", gap: "6px" }, children: TEMPLATES.map((t) => (_jsx("button", { onClick: () => setForm((f) => ({ ...f, code: t.code })), style: { ...iconBtnStyle, fontSize: "11px", padding: "3px 8px" }, children: t.label }, t.label))) })] }), _jsx("textarea", { value: form.code, onChange: (e) => setForm((f) => ({ ...f, code: e.target.value })), rows: 10, style: { ...inputStyle, fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: "12px", resize: "vertical", lineHeight: 1.6 }, spellCheck: false })] }), _jsxs("div", { style: { display: "flex", gap: "10px", justifyContent: "flex-end" }, children: [_jsx("button", { onClick: () => { setShowCreate(false); setEditingId(null); resetForm(); }, style: secondaryBtnStyle, children: "Cancel" }), _jsxs("button", { onClick: handleSave, style: primaryBtnStyle, children: [_jsx(Save, { size: 14 }), " ", editingId ? "Save Changes" : "Create Tool"] })] })] })), loading ? (_jsx("div", { style: { textAlign: "center", padding: "60px", color: "var(--text-muted)" }, children: "Loading tools..." })) : tools.length === 0 ? (_jsxs("div", { style: { ...cardStyle, textAlign: "center", padding: "52px" }, children: [_jsx(Wrench, { size: 42, color: "rgba(99,102,241,0.25)", style: { marginBottom: "14px" } }), _jsx("p", { style: { color: "var(--text-muted)", margin: 0, fontWeight: 500 }, children: "No custom tools yet" }), _jsx("p", { style: { color: "rgba(148,163,184,0.4)", margin: "4px 0 0", fontSize: "12px" }, children: "Click \"New Tool\" to create your first custom JavaScript tool." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: tools.map((tool) => (_jsxs("div", { style: cardStyle, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { width: "40px", height: "40px", borderRadius: "9px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: _jsx(Wrench, { size: 18, color: "var(--primary)" }) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", fontFamily: "monospace" }, children: tool.name }), _jsx("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }, children: tool.description }), _jsxs("div", { style: { display: "flex", gap: "5px", marginTop: "6px", flexWrap: "wrap" }, children: [tool.parameters.map((p) => (_jsxs("span", { style: { fontSize: "10px", padding: "2px 7px", background: "rgba(99,102,241,0.1)", borderRadius: "6px", color: "rgba(148,163,184,0.75)", fontFamily: "monospace" }, children: [p.name, ": ", p.type] }, p.name))), tool.parameters.length === 0 && _jsx("span", { style: { fontSize: "10px", color: "rgba(148,163,184,0.35)" }, children: "no params" })] })] })] }), _jsxs("div", { style: { display: "flex", gap: "6px", flexShrink: 0, marginLeft: "12px" }, children: [_jsx("button", { onClick: () => setExpandedId(expandedId === tool.id ? null : tool.id), style: iconBtnStyle, children: expandedId === tool.id ? _jsx(ChevronUp, { size: 15 }) : _jsx(ChevronDown, { size: 15 }) }), _jsx("button", { onClick: () => handleEdit(tool), style: iconBtnStyle, children: _jsx(Pencil, { size: 15 }) }), _jsx("button", { onClick: () => handleDelete(tool.id), style: { ...iconBtnStyle, color: "var(--error)" }, children: _jsx(Trash2, { size: 15 }) })] })] }), expandedId === tool.id && (_jsxs("div", { style: { marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: [tool.parameters.length > 0 && (_jsx("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }, children: tool.parameters.map((p) => (_jsxs("div", { style: { flex: "1", minWidth: "160px" }, children: [_jsxs("label", { style: labelStyle, children: [p.name, " ", _jsxs("span", { style: { color: "rgba(148,163,184,0.4)" }, children: ["(", p.type, ")"] })] }), _jsx("input", { value: runArgs[`${tool.id}:${p.name}`] ?? "", onChange: (e) => setRunArgs((prev) => ({ ...prev, [`${tool.id}:${p.name}`]: e.target.value })), placeholder: `Enter ${p.name}...`, style: { ...inputStyle, fontSize: "12px" } })] }, p.name))) })), _jsxs("button", { onClick: () => handleRun(tool), disabled: runningId === tool.id, style: primaryBtnStyle, children: [_jsx(Play, { size: 13 }), " ", runningId === tool.id ? "Running..." : "Run Tool"] }), runResults[tool.id] && (_jsxs("div", { style: { marginTop: "12px", background: "rgba(5,5,20,0.85)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", padding: "14px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [runResults[tool.id].success
                                                            ? _jsx(CheckCircle2, { size: 13, color: "#34d399" })
                                                            : _jsx(AlertCircle, { size: 13, color: "#f87171" }), _jsx("span", { style: { fontSize: "12px", fontWeight: 600, color: runResults[tool.id].success ? "#34d399" : "#f87171" }, children: runResults[tool.id].success ? "Success" : "Error" })] }), _jsx(CopyButton, { text: JSON.stringify(runResults[tool.id].output ?? runResults[tool.id].error, null, 2) })] }), _jsx("pre", { style: { margin: 0, fontSize: "12px", color: "rgba(203,213,225,0.85)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: JSON.stringify(runResults[tool.id].output ?? runResults[tool.id].error, null, 2) }), runResults[tool.id].logs?.length > 0 && (_jsxs("div", { style: { marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(99,102,241,0.1)" }, children: [_jsx("div", { style: { fontSize: "11px", color: "rgba(148,163,184,0.45)", marginBottom: "5px" }, children: "Console output:" }), runResults[tool.id].logs.map((l, i) => (_jsx("div", { style: { fontSize: "11px", color: "rgba(148,163,184,0.65)", fontFamily: "monospace" }, children: l }, i)))] }))] }))] }))] }, tool.id))) }))] }));
};
const cardStyle = { background: "rgba(15,15,35,0.6)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: "12px", padding: "20px", backdropFilter: "blur(10px)" };
const primaryBtnStyle = { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, var(--primary), var(--secondary))", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const secondaryBtnStyle = { background: "rgba(30,30,60,0.5)", color: "var(--text-secondary)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" };
const iconBtnStyle = { background: "rgba(30,30,60,0.5)", color: "var(--text-secondary)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const labelStyle = { display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 };
const inputStyle = { width: "100%", boxSizing: "border-box", background: "rgba(10,10,30,0.6)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)", fontSize: "13px", outline: "none", fontFamily: "inherit" };
//# sourceMappingURL=CustomTools.js.map