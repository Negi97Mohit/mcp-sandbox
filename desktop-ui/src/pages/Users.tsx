import React, { useEffect, useState } from "react";
import { Shield, UserMinus, Plus, FolderPlus, Copy, Check } from "lucide-react";
import { api } from "../api/bridge.js";

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<"read" | "write" | "admin">("read");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load permission database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setError(null);
    try {
      await api.grantUser(newUserId.trim(), newRole);
      setNewUserId("");
      loadUsers();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleRoleChange = async (userId: string, role: "read" | "write" | "admin") => {
    setError(null);
    try {
      await api.grantUser(userId, role);
      loadUsers();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm(`Are you sure you want to revoke permissions for user: ${userId}?`)) return;
    setError(null);
    try {
      await api.revokeUser(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleCreateWorkspace = async (userId: string) => {
    setError(null);
    try {
      await api.createWorkspace(userId);
      alert("Workspace directory ensured successfully!");
      loadUsers();
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
          User Permissions
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Authorize specific users, configure roles, and inspect absolute sandboxed paths.
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
            Granted Logins
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "10px", fontWeight: 500 }}>User ID</th>
                  <th style={{ padding: "10px", fontWeight: 500 }}>Permission Level</th>
                  <th style={{ padding: "10px", fontWeight: 500 }}>Local Sandboxed Cwd</th>
                  <th style={{ padding: "10px", fontWeight: 500, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      Loading permission tables...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      No permissions granted yet.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.userId} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "14px 10px", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{u.userId}</span>
                        <button 
                          onClick={() => handleCopy(u.userId)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                        >
                          {copiedId === u.userId ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        </button>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.userId, e.target.value as any)}
                          style={{
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "12px",
                          }}
                        >
                          <option value="read">Read Only</option>
                          <option value="write">Read + Write</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td style={{ padding: "10px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "11px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.workspacePath || "None (Global)"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => handleCreateWorkspace(u.userId)}
                            title="Ensure Workspace Folder"
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
                          <button 
                            onClick={() => handleRevoke(u.userId)}
                            title="Revoke Permission"
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "none",
                              color: "var(--error)",
                              padding: "6px",
                              borderRadius: "6px",
                              cursor: "pointer"
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
            <Shield size={18} color="var(--primary)" /> Grant Access
          </h2>

          <form onSubmit={handleGrant} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Platform User ID
              </label>
              <input 
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="e.g. 1234567890123456..."
                style={{
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Permission Level
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {["read", "write", "admin"].map(role => (
                  <button 
                    key={role}
                    type="button"
                    onClick={() => setNewRole(role as any)}
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
