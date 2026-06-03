import React, { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, CheckCircle2, FolderSearch, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "../api/bridge.js";

interface Workspace {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    isActive: boolean;
}

export const Workspaces: React.FC = () => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadWorkspaces(); }, []);

    const handleBrowse = async () => {
        const picked = await api.browseForWorkspace();
        if (picked) setNewPath(picked);
    };

    const handleAdd = async () => {
        if (!newName.trim() || !newPath.trim()) { setError("Both name and path are required."); return; }
        setSaving(true); setError("");
        try {
            const res = await api.createWorkspaceDir(newName.trim(), newPath.trim());
            if (!res.success) { setError(res.error || "Failed to add workspace"); return; }
            setNewName(""); setNewPath(""); setShowAdd(false);
            await loadWorkspaces();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSetActive = async (id: string) => {
        await api.setActiveWorkspace(id);
        await loadWorkspaces();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this workspace? (Your files will NOT be deleted)")) return;
        await api.deleteWorkspace(id);
        await loadWorkspaces();
    };

    return (
        <div style={{ maxWidth: "900px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
                        <FolderOpen size={22} color="var(--primary)" /> Workspaces
                    </h1>
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "560px" }}>
                        Register local project directories. The active workspace is used as the root for all shell commands and file operations.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                    <button onClick={loadWorkspaces} style={iconBtnStyle} title="Refresh"><RefreshCw size={15} /></button>
                    <button onClick={() => { setShowAdd(!showAdd); setError(""); }} className="glow-btn" style={primaryBtnStyle}>
                        <Plus size={15} /> Add Workspace
                    </button>
                </div>
            </div>

            {/* Add Panel */}
            {showAdd && (
                <div style={{ ...cardStyle, marginBottom: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Register New Workspace</h3>
                    {error && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "14px" }}>
                        <div>
                            <label style={labelStyle}>Workspace Name</label>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. My App" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Directory Path</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="e.g. C:\dev\my-app" style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={handleBrowse} style={iconBtnStyle} title="Browse for folder"><FolderSearch size={15} /></button>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button onClick={() => setShowAdd(false)} style={secondaryBtnStyle}>Cancel</button>
                        <button onClick={handleAdd} disabled={saving} className="glow-btn" style={primaryBtnStyle}>{saving ? "Adding..." : "Add Workspace"}</button>
                    </div>
                </div>
            )}

            {/* Workspace List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading workspaces...</div>
            ) : workspaces.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: "52px" }}>
                    <FolderOpen size={42} color="rgba(99,102,241,0.25)" style={{ marginBottom: "14px" }} />
                    <p style={{ color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>No workspaces registered yet</p>
                    <p style={{ color: "rgba(148,163,184,0.4)", margin: "4px 0 0", fontSize: "12px" }}>Click "Add Workspace" to register your first project directory.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {workspaces.map((ws) => (
                        <div
                            key={ws.id}
                            onClick={() => !ws.isActive && handleSetActive(ws.id)}
                            style={{
                                ...cardStyle,
                                borderLeft: `3px solid ${ws.isActive ? "var(--primary)" : "transparent"}`,
                                background: ws.isActive
                                    ? "var(--sidebar-active-bg, var(--primary-glow))"
                                    : "var(--bg-card)",
                                cursor: ws.isActive ? "default" : "pointer",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                                        background: ws.isActive ? "var(--primary-glow)" : "var(--bg-card)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <FolderOpen size={20} color={ws.isActive ? "var(--primary)" : "rgba(148,163,184,0.4)"} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                            <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>{ws.name}</span>
                                            {ws.isActive && (
                                                <span style={{ fontSize: "9px", padding: "2px 8px", background: "var(--primary-glow)", borderRadius: "10px", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {ws.path}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "rgba(148,163,184,0.35)", marginTop: "3px" }}>
                                            Added {new Date(ws.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexShrink: 0, marginLeft: "12px" }} onClick={(e) => e.stopPropagation()}>
                                    {!ws.isActive && (
                                        <button onClick={() => handleSetActive(ws.id)} title="Set as active workspace" style={{ ...iconBtnStyle, color: "#34d399" }}>
                                            <CheckCircle2 size={15} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(ws.id)} title="Remove workspace" style={{ ...iconBtnStyle, color: "var(--error)" }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(10px)",
};
const primaryBtnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
};
const secondaryBtnStyle: React.CSSProperties = {
    background: "var(--bg-card)", color: "var(--text-secondary)",
    border: "1px solid var(--border)", borderRadius: "8px",
    padding: "8px 16px", fontSize: "13px", cursor: "pointer",
};
const iconBtnStyle: React.CSSProperties = {
    background: "var(--bg-card)", color: "var(--text-secondary)",
    border: "1px solid var(--border)", borderRadius: "8px",
    padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "var(--bg-deep)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)",
    fontSize: "13px", outline: "none", fontFamily: "inherit",
};
