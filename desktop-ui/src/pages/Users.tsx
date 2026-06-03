import React, { useEffect, useState } from "react";
import { Shield, UserMinus, Plus, FolderPlus, Copy, Check, Info, Lock } from "lucide-react";
import { api } from "../api/bridge.js";

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<"read" | "write" | "admin">("read");
  const [newWorkspaceId, setNewWorkspaceId] = useState("");
  const [newCanManageTools, setNewCanManageTools] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await api.getUsers();
      setUsers(userData);
      const wsData = await api.listWorkspaces();
      setWorkspaces(wsData);
    } catch (e) {
      console.error(e);
      setError("Failed to load permission or workspace databases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setError(null);
    try {
      await api.grantUser(
        newUserId.trim(),
        newRole,
        newWorkspaceId || undefined,
        newCanManageTools
      );
      setNewUserId("");
      setNewWorkspaceId("");
      setNewCanManageTools(false);
      loadData();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleRoleChange = async (userId: string, role: "read" | "write" | "admin", workspaceId?: string, canManageTools?: boolean) => {
    setError(null);
    try {
      await api.grantUser(userId, role, workspaceId, canManageTools);
      loadData();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleWorkspaceChange = async (userId: string, role: string, workspaceId: string, canManageTools?: boolean) => {
    setError(null);
    try {
      await api.grantUser(userId, role as any, workspaceId || undefined, canManageTools);
      loadData();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleManageToolsChange = async (userId: string, role: string, workspaceId?: string, canManageTools?: boolean) => {
    setError(null);
    try {
      await api.grantUser(userId, role as any, workspaceId, canManageTools);
      loadData();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm(`Are you sure you want to revoke permissions for user: ${userId}?`)) return;
    setError(null);
    try {
      await api.revokeUser(userId);
      loadData();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleCreateWorkspace = async (userId: string) => {
    setError(null);
    try {
      await api.createWorkspace(userId);
      alert("Workspace directory ensured successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }}>
          User Permissions & Workspaces
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Authorize specific users, assign workspace folders, configure access roles, and delegate tool management rights.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "var(--error)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Split grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Side: Users Database list */}
        <div className="glass" style={{ padding: "24px", overflow: "hidden" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px" }}>
            Authorized Logins & Scopes
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "10px", fontWeight: 500 }}>User ID</th>
                  <th style={{ padding: "10px", fontWeight: 500 }}>Access Role</th>
                  <th style={{ padding: "10px", fontWeight: 500 }}>Assigned Workspace</th>
                  <th style={{ padding: "10px", fontWeight: 500, textAlign: "center" }}>Manage Tools</th>
                  <th style={{ padding: "10px", fontWeight: 500 }}>Absolute Path</th>
                  <th style={{ padding: "10px", fontWeight: 500, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      Loading permission tables...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      No permissions granted yet.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.userId} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                      {/* User ID */}
                      <td style={{ padding: "14px 10px", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }} title={u.userId}>
                          {u.userId}
                        </span>
                        <button 
                          onClick={() => handleCopy(u.userId)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 0 }}
                          title="Copy User ID"
                        >
                          {copiedId === u.userId ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        </button>
                      </td>

                      {/* Access Role */}
                      <td style={{ padding: "10px" }}>
                        <select 
                          value={u.role}
                          disabled={u.role === "admin"}
                          onChange={(e) => handleRoleChange(u.userId, e.target.value as any, u.workspaceId, u.canManageTools)}
                          style={selectStyle}
                        >
                          <option value="read">Read Only</option>
                          <option value="write">Read + Write</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      {/* Assigned Workspace Selector */}
                      <td style={{ padding: "10px" }}>
                        {u.role === "admin" ? (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                            <Lock size={11} /> Admin Active
                          </span>
                        ) : (
                          <select
                            value={u.workspaceId || ""}
                            onChange={(e) => handleWorkspaceChange(u.userId, u.role, e.target.value, u.canManageTools)}
                            style={selectStyle}
                          >
                            <option value="">Default Sandbox</option>
                            {workspaces.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Tool Creation Permission */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={u.role === "admin" ? true : !!u.canManageTools}
                          disabled={u.role === "admin"}
                          onChange={(e) => handleManageToolsChange(u.userId, u.role, u.workspaceId, e.target.checked)}
                          style={{ cursor: u.role === "admin" ? "not-allowed" : "pointer" }}
                        />
                      </td>

                      {/* Resolved Local Path */}
                      <td style={{ padding: "10px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "11px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.workspacePath}>
                        {u.workspacePath}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          {u.role !== "admin" && !u.workspaceId && (
                            <button 
                              onClick={() => handleCreateWorkspace(u.userId)}
                              title="Ensure Sandbox Directory"
                              style={{
                                background: "rgba(99,102,241,0.1)",
                                border: "none",
                                color: "var(--primary)",
                                padding: "6px",
                                borderRadius: "6px",
                                cursor: "pointer"
                              }}
                            >
                              <FolderPlus size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleRevoke(u.userId)}
                            disabled={u.role === "admin"}
                            title="Revoke Permission"
                            style={{
                              background: u.role === "admin" ? "rgba(255,255,255,0.02)" : "rgba(239, 68, 68, 0.1)",
                              border: "none",
                              color: u.role === "admin" ? "var(--text-muted)" : "var(--error)",
                              padding: "6px",
                              borderRadius: "6px",
                              cursor: u.role === "admin" ? "not-allowed" : "pointer"
                            }}
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Grant new user form */}
        <div className="glass" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Shield size={18} color="var(--primary)" /> Authorize User
          </h2>

          <form onSubmit={handleGrant} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* User ID */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>
                Platform User ID (e.g. Discord ID)
              </label>
              <input 
                type="text"
                required
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="e.g. 1210691284323..."
                style={inputStyle}
              />
            </div>

            {/* Access Role */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>
                Permission Level
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {["read", "write", "admin"].map(role => (
                  <button 
                    key={role}
                    type="button"
                    onClick={() => {
                      setNewRole(role as any);
                      if (role === "admin") {
                        setNewWorkspaceId("");
                        setNewCanManageTools(true);
                      }
                    }}
                    style={{
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
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Assign Workspace */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>
                Assign Workspace Scope
              </label>
              <select
                disabled={newRole === "admin"}
                value={newWorkspaceId}
                onChange={(e) => setNewWorkspaceId(e.target.value)}
                style={{ ...selectStyle, padding: "10px 12px", width: "100%" }}
              >
                <option value="">Default Sandbox (workspaces/userId)</option>
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.path})</option>
                ))}
              </select>
            </div>

            {/* Can Manage Tools */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <input
                type="checkbox"
                id="newCanManageTools"
                disabled={newRole === "admin"}
                checked={newRole === "admin" ? true : newCanManageTools}
                onChange={(e) => setNewCanManageTools(e.target.checked)}
                style={{ cursor: newRole === "admin" ? "not-allowed" : "pointer" }}
              />
              <label 
                htmlFor="newCanManageTools" 
                style={{ ...labelStyle, marginBottom: 0, cursor: newRole === "admin" ? "not-allowed" : "pointer", userSelect: "none" }}
              >
                Delegate Custom Tool Creation
              </label>
            </div>

            {/* Hint alert */}
            <div style={hintCardStyle}>
              <Info size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>
                Standard users will be sandboxed to their assigned workspace. Multiple users assigned to the same workspace will share the directory.
              </span>
            </div>

            <button 
              type="submit"
              disabled={!newUserId.trim()}
              className="glow-btn"
              style={{
                padding: "10px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px"
              }}
            >
              <Plus size={14} /> Authorize Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  background: "rgba(10,10,25,0.6)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "12px",
  outline: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-secondary)",
  fontWeight: 500,
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "rgba(10,10,25,0.6)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontFamily: "monospace",
  outline: "none",
};

const hintCardStyle: React.CSSProperties = {
  background: "rgba(99,102,241,0.06)",
  border: "1px solid rgba(99,102,241,0.15)",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "11px",
  color: "var(--text-secondary)",
  display: "flex",
  gap: "8px",
  lineHeight: "1.4",
};
