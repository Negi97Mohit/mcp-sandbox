import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, CheckCircle2, FolderSearch, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "../api/bridge.js";
export const Workspaces = () => {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPath, setNewPath] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const loadWorkspaces = async () => {
        setLoading(true);
        try {
            setWorkspaces(await api.listWorkspaces());
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadWorkspaces(); }, []);
    const handleBrowse = async () => {
        const picked = await api.browseForWorkspace();
        if (picked)
            setNewPath(picked);
    };
    const handleAdd = async () => {
        if (!newName.trim() || !newPath.trim()) {
            setError("Both name and path are required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await api.createWorkspaceDir(newName.trim(), newPath.trim());
            if (!res.success) {
                setError(res.error || "Failed to add workspace");
                return;
            }
            setNewName("");
            setNewPath("");
            setShowAdd(false);
            await loadWorkspaces();
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleSetActive = async (id) => {
        await api.setActiveWorkspace(id);
        await loadWorkspaces();
    };
    const handleDelete = async (id) => {
        if (!confirm("Remove this workspace? (Your files will NOT be deleted)"))
            return;
        await api.deleteWorkspace(id);
        await loadWorkspaces();
    };
    return (_jsxs("div", { style: { maxWidth: "900px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }, children: [_jsxs("div", { children: [_jsxs("h1", { style: { margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx(FolderOpen, { size: 22, color: "var(--primary)" }), " Workspaces"] }), _jsx("p", { style: { margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "560px" }, children: "Register local project directories. The active workspace is used as the root for all shell commands and file operations." })] }), _jsxs("div", { style: { display: "flex", gap: "10px", flexShrink: 0 }, children: [_jsx("button", { onClick: loadWorkspaces, style: iconBtnStyle, title: "Refresh", children: _jsx(RefreshCw, { size: 15 }) }), _jsxs("button", { onClick: () => { setShowAdd(!showAdd); setError(""); }, style: primaryBtnStyle, children: [_jsx(Plus, { size: 15 }), " Add Workspace"] })] })] }), showAdd && (_jsxs("div", { style: { ...cardStyle, marginBottom: "20px" }, children: [_jsx("h3", { style: { margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }, children: "Register New Workspace" }), error && (_jsxs("div", { style: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(AlertCircle, { size: 14 }), " ", error] })), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "14px" }, children: [_jsxs("div", { children: [_jsx("label", { style: labelStyle, children: "Workspace Name" }), _jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "e.g. My App", style: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { style: labelStyle, children: "Directory Path" }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("input", { value: newPath, onChange: (e) => setNewPath(e.target.value), placeholder: "e.g. C:\\dev\\my-app", style: { ...inputStyle, flex: 1 } }), _jsx("button", { onClick: handleBrowse, style: iconBtnStyle, title: "Browse for folder", children: _jsx(FolderSearch, { size: 15 }) })] })] })] }), _jsxs("div", { style: { display: "flex", gap: "10px", justifyContent: "flex-end" }, children: [_jsx("button", { onClick: () => setShowAdd(false), style: secondaryBtnStyle, children: "Cancel" }), _jsx("button", { onClick: handleAdd, disabled: saving, style: primaryBtnStyle, children: saving ? "Adding..." : "Add Workspace" })] })] })), loading ? (_jsx("div", { style: { textAlign: "center", padding: "60px", color: "var(--text-muted)" }, children: "Loading workspaces..." })) : workspaces.length === 0 ? (_jsxs("div", { style: { ...cardStyle, textAlign: "center", padding: "52px" }, children: [_jsx(FolderOpen, { size: 42, color: "rgba(99,102,241,0.25)", style: { marginBottom: "14px" } }), _jsx("p", { style: { color: "var(--text-muted)", margin: 0, fontWeight: 500 }, children: "No workspaces registered yet" }), _jsx("p", { style: { color: "rgba(148,163,184,0.4)", margin: "4px 0 0", fontSize: "12px" }, children: "Click \"Add Workspace\" to register your first project directory." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: workspaces.map((ws) => (_jsx("div", { onClick: () => !ws.isActive && handleSetActive(ws.id), style: {
                        ...cardStyle,
                        borderLeft: `3px solid ${ws.isActive ? "var(--primary)" : "transparent"}`,
                        background: ws.isActive
                            ? "linear-gradient(135deg, rgba(99,102,241,0.09), rgba(10,10,30,0.65))"
                            : "rgba(15,15,35,0.6)",
                        cursor: ws.isActive ? "default" : "pointer",
                        transition: "all 0.2s ease",
                    }, children: _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                            width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                                            background: ws.isActive ? "rgba(99,102,241,0.2)" : "rgba(30,30,60,0.5)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }, children: _jsx(FolderOpen, { size: 20, color: ws.isActive ? "var(--primary)" : "rgba(148,163,184,0.4)" }) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }, children: [_jsx("span", { style: { fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }, children: ws.name }), ws.isActive && (_jsx("span", { style: { fontSize: "9px", padding: "2px 8px", background: "rgba(99,102,241,0.22)", borderRadius: "10px", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }, children: "Active" }))] }), _jsx("div", { style: { fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: ws.path }), _jsxs("div", { style: { fontSize: "11px", color: "rgba(148,163,184,0.35)", marginTop: "3px" }, children: ["Added ", new Date(ws.createdAt).toLocaleDateString()] })] })] }), _jsxs("div", { style: { display: "flex", gap: "8px", flexShrink: 0, marginLeft: "12px" }, onClick: (e) => e.stopPropagation(), children: [!ws.isActive && (_jsx("button", { onClick: () => handleSetActive(ws.id), title: "Set as active workspace", style: { ...iconBtnStyle, color: "#34d399" }, children: _jsx(CheckCircle2, { size: 15 }) })), _jsx("button", { onClick: () => handleDelete(ws.id), title: "Remove workspace", style: { ...iconBtnStyle, color: "var(--error)" }, children: _jsx(Trash2, { size: 15 }) })] })] }) }, ws.id))) }))] }));
};
const cardStyle = {
    background: "rgba(15,15,35,0.6)",
    border: "1px solid rgba(99,102,241,0.12)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(10px)",
};
const primaryBtnStyle = {
    display: "flex", alignItems: "center", gap: "6px",
    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
};
const secondaryBtnStyle = {
    background: "rgba(30,30,60,0.5)", color: "var(--text-secondary)",
    border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px",
    padding: "8px 16px", fontSize: "13px", cursor: "pointer",
};
const iconBtnStyle = {
    background: "rgba(30,30,60,0.5)", color: "var(--text-secondary)",
    border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px",
    padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const labelStyle = {
    display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500,
};
const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(10,10,30,0.6)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)",
    fontSize: "13px", outline: "none", fontFamily: "inherit",
};
//# sourceMappingURL=Workspaces.js.map