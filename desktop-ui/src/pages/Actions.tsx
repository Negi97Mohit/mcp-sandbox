import React, { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, User, Copy } from "lucide-react";
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
      {copied ? <CheckCircle size={12} color="var(--success)" /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

export const Actions: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [filterTool, setFilterTool] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActions = async () => {
    setLoading(true);
    try {
      const data = await api.getActions({
        toolName: filterTool || undefined,
        platform: filterPlatform || undefined,
      });
      setActions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [filterTool, filterPlatform]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }}>
          Action Logs
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Inspect absolute historical logs for every DevOps tool run by the AI agent.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass" style={{ padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
        <Search size={16} color="var(--text-muted)" />
        
        {/* Tool filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Tool Name:</span>
          <select 
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12.5px"
            }}
          >
            <option value="">All Tools</option>
            <option value="run_shell">run_shell</option>
            <option value="write_file">write_file</option>
            <option value="read_file">read_file</option>
            <option value="list_dir">list_dir</option>
            <option value="netlify_deploy">netlify_deploy</option>
            <option value="netlify_status">netlify_status</option>
          </select>
        </div>

        {/* Platform filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Origin Channel:</span>
          <select 
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12.5px"
            }}
          >
            <option value="">All Channels</option>
            <option value="discord">Discord Chat</option>
            <option value="desktop-ui">Desktop App</option>
          </select>
        </div>
      </div>

      {/* Action Logs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div className="glass" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading historical logs...
          </div>
        ) : actions.length === 0 ? (
          <div className="glass" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <Clock size={32} color="rgba(99,102,241,0.3)" />
            <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>No action logs found.</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Only tool executions (e.g. running shell commands, writing files) initiated by the AI will appear here. Normal chat messages are not logged as actions.</div>
            </div>
          </div>
        ) : (
          actions.map(a => {
            const isExpanded = expandedId === a.id;
            return (
              <div 
                key={a.id} 
                className="glass"
                style={{
                  padding: "16px 20px",
                  borderColor: isExpanded ? "var(--primary)" : "var(--border)",
                  transition: "all 0.2s"
                }}
              >
                {/* List Summary Row */}
                <div 
                  onClick={() => toggleExpand(a.id)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {a.status === "success" ? (
                      <CheckCircle size={18} color="var(--success)" />
                    ) : (
                      <XCircle size={18} color="var(--error)" />
                    )}
                    
                    <span style={{ 
                      fontFamily: "monospace", 
                      fontWeight: 700, 
                      fontSize: "13px", 
                      color: "var(--primary)",
                      padding: "2px 8px",
                      background: "rgba(99,102,241,0.08)",
                      borderRadius: "4px"
                    }}>
                      {a.toolName}
                    </span>
 
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {a.durationMs}ms
                    </span>
 
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <User size={12} /> {a.userId === "desktop-admin" ? "Admin" : a.userId}
                    </span>
                  </div>
 
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ 
                      fontSize: "10px", 
                      padding: "2px 8px", 
                      borderRadius: "12px", 
                      background: a.platform === "discord" ? "rgba(99,102,241,0.12)" : "rgba(168,85,247,0.12)",
                      color: a.platform === "discord" ? "var(--primary)" : "var(--secondary)" 
                    }}>
                      {a.platform.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }} title="Time executed">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                    <div title={isExpanded ? "Collapse details" : "Expand details"} style={{ display: "flex" }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>
 
                {/* Expanded Details Panels */}
                {isExpanded && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Arguments input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                          Call Arguments
                        </span>
                        <CopyButton text={JSON.stringify(a.arguments, null, 2)} />
                      </div>
                      <pre style={{
                        background: "#020208",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "6px",
                        padding: "12px",
                        fontFamily: "monospace",
                        fontSize: "11.5px",
                        color: "var(--text-secondary)",
                        maxHeight: "220px",
                        overflow: "auto",
                        margin: 0
                      }}>
                        {JSON.stringify(a.arguments, null, 2)}
                      </pre>
                    </div>
 
                    {/* Result Output */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                          Response Output
                        </span>
                        <CopyButton text={typeof a.result === "string" ? a.result : JSON.stringify(a.result, null, 2)} />
                      </div>
                      <pre style={{
                        background: "#020208",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "6px",
                        padding: "12px",
                        fontFamily: "monospace",
                        fontSize: "11.5px",
                        color: a.status === "success" ? "var(--text-primary)" : "var(--error)",
                        maxHeight: "220px",
                        overflow: "auto",
                        margin: 0
                      }}>
                        {typeof a.result === "string" ? a.result : JSON.stringify(a.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
