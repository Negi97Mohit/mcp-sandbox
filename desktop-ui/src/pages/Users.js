import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Shield, UserMinus, Plus, FolderPlus, Copy, Check } from "lucide-react";
import { api } from "../api/bridge.js";
export const Users = () => {
    const [users, setUsers] = useState([]);
    const [newUserId, setNewUserId] = useState("");
    const [newRole, setNewRole] = useState("read");
    const [copiedId, setCopiedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getUsers();
            setUsers(data);
        }
        catch (e) {
            console.error(e);
            setError("Failed to load permission database.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadUsers();
    }, []);
    const handleGrant = async (e) => {
        e.preventDefault();
        if (!newUserId.trim())
            return;
        setError(null);
        try {
            await api.grantUser(newUserId.trim(), newRole);
            setNewUserId("");
            loadUsers();
        }
        catch (err) {
            setError(err.message || String(err));
        }
    };
    const handleRoleChange = async (userId, role) => {
        setError(null);
        try {
            await api.grantUser(userId, role);
            loadUsers();
        }
        catch (err) {
            setError(err.message || String(err));
        }
    };
    const handleRevoke = async (userId) => {
        if (!confirm(`Are you sure you want to revoke permissions for user: ${userId}?`))
            return;
        setError(null);
        try {
            await api.revokeUser(userId);
            loadUsers();
        }
        catch (err) {
            setError(err.message || String(err));
        }
    };
    const handleCreateWorkspace = async (userId) => {
        setError(null);
        try {
            await api.createWorkspace(userId);
            alert("Workspace directory ensured successfully!");
            loadUsers();
        }
        catch (err) {
            setError(err.message || String(err));
        }
    };
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
    };
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }, children: "User Permissions" }), _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }, children: "Authorize specific users, configure roles, and inspect absolute sandboxed paths." })] }), error && (_jsx("div", { style: { padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "var(--error)", fontSize: "13px" }, children: error })), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "24px", alignItems: "start" }, children: [_jsxs("div", { className: "glass", style: { padding: "24px", overflow: "hidden" }, children: [_jsx("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px" }, children: "Granted Logins" }), _jsx("div", { style: { overflowX: "auto" }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }, children: [_jsx("th", { style: { padding: "10px", fontWeight: 500 }, children: "User ID" }), _jsx("th", { style: { padding: "10px", fontWeight: 500 }, children: "Permission Level" }), _jsx("th", { style: { padding: "10px", fontWeight: 500 }, children: "Local Sandboxed Cwd" }), _jsx("th", { style: { padding: "10px", fontWeight: 500, textAlign: "right" }, children: "Actions" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { padding: "20px", textAlign: "center", color: "var(--text-muted)" }, children: "Loading permission tables..." }) })) : users.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { padding: "20px", textAlign: "center", color: "var(--text-muted)" }, children: "No permissions granted yet." }) })) : (users.map(u => (_jsxs("tr", { style: { borderBottom: "1px solid rgba(255,255,255,0.02)" }, children: [_jsxs("td", { style: { padding: "14px 10px", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }, children: [_jsx("span", { children: u.userId }), _jsx("button", { onClick: () => handleCopy(u.userId), style: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }, children: copiedId === u.userId ? _jsx(Check, { size: 12, color: "var(--success)" }) : _jsx(Copy, { size: 12 }) })] }), _jsx("td", { style: { padding: "10px" }, children: _jsxs("select", { value: u.role, onChange: (e) => handleRoleChange(u.userId, e.target.value), style: {
                                                                background: "rgba(0,0,0,0.3)",
                                                                border: "1px solid var(--border)",
                                                                color: "var(--text-primary)",
                                                                borderRadius: "6px",
                                                                padding: "4px 8px",
                                                                fontSize: "12px",
                                                            }, children: [_jsx("option", { value: "read", children: "Read Only" }), _jsx("option", { value: "write", children: "Read + Write" }), _jsx("option", { value: "admin", children: "Administrator" })] }) }), _jsx("td", { style: { padding: "10px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "11px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u.workspacePath || "None (Global)" }), _jsx("td", { style: { padding: "10px", textAlign: "right" }, children: _jsxs("div", { style: { display: "flex", gap: "8px", justifyContent: "flex-end" }, children: [_jsx("button", { onClick: () => handleCreateWorkspace(u.userId), title: "Ensure Workspace Folder", style: {
                                                                        background: "rgba(99,102,241,0.1)",
                                                                        border: "none",
                                                                        color: "var(--primary)",
                                                                        padding: "6px",
                                                                        borderRadius: "6px",
                                                                        cursor: "pointer"
                                                                    }, children: _jsx(FolderPlus, { size: 14 }) }), _jsx("button", { onClick: () => handleRevoke(u.userId), title: "Revoke Permission", style: {
                                                                        background: "rgba(239, 68, 68, 0.1)",
                                                                        border: "none",
                                                                        color: "var(--error)",
                                                                        padding: "6px",
                                                                        borderRadius: "6px",
                                                                        cursor: "pointer"
                                                                    }, children: _jsx(UserMinus, { size: 14 }) })] }) })] }, u.userId)))) })] }) })] }), _jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }, children: [_jsx(Shield, { size: 18, color: "var(--primary)" }), " Grant Access"] }), _jsxs("form", { onSubmit: handleGrant, style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }, children: "Platform User ID" }), _jsx("input", { type: "text", value: newUserId, onChange: (e) => setNewUserId(e.target.value), placeholder: "e.g. 1234567890123456...", style: {
                                                    padding: "10px 12px",
                                                    background: "rgba(0,0,0,0.25)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "8px",
                                                    color: "var(--text-primary)",
                                                    fontSize: "13px",
                                                    fontFamily: "monospace"
                                                } })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }, children: "Permission Level" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }, children: ["read", "write", "admin"].map(role => (_jsx("button", { type: "button", onClick: () => setNewRole(role), style: {
                                                        padding: "8px",
                                                        background: newRole === role ? "var(--primary)" : "rgba(0,0,0,0.2)",
                                                        border: "1px solid",
                                                        borderColor: newRole === role ? "var(--primary)" : "var(--border)",
                                                        color: "white",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        textTransform: "capitalize",
                                                        transition: "all 0.2s"
                                                    }, children: role }, role))) })] }), _jsxs("button", { type: "submit", disabled: !newUserId.trim(), className: "glow-btn", style: {
                                            padding: "10px",
                                            fontSize: "13px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            marginTop: "8px"
                                        }, children: [_jsx(Plus, { size: 14 }), " Authorize Login"] })] })] })] })] }));
};
//# sourceMappingURL=Users.js.map