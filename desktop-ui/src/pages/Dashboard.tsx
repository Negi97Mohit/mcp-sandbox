import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Users, 
  Zap, 
  Clock, 
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { api } from "../api/bridge.js";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({ pieData: [], lineData: [] });
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>({ overallStatus: "loading", checks: [] });
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const p = await api.getPlatforms();
      const u = await api.getUsers();
      const h = await api.runHealthCheck(force);
      const s = await api.getStatsChartData(7);
      const a = await api.getActions({});

      setPlatforms(p);
      setUsers(u);
      setHealth(h);
      setStats(s);
      setActions(a.slice(0, 5));
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const runningPlatforms = platforms.filter(p => p.status === "running").length;
  const lastLineData = stats.lineData[stats.lineData.length - 1] || {};
  const totalActions = stats.lineData.reduce((acc: number, cur: any) => acc + (cur.tools || 0), 0);
  const avgResponseTime = lastLineData.responseTime || 0;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }}>
            Control Center
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Live sandbox metrics and system automation dashboard.
          </p>
        </div>
        <button 
          onClick={() => loadData(true)}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Grid of Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        <div className="glass" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--primary)" }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Active Platforms</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }}>
              {runningPlatforms} <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 400 }}>/ {platforms.length}</span>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "rgba(168, 85, 247, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--secondary)" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Permitted Users</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }}>
              {users.length}
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "rgba(236, 72, 153, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--accent)" }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Total Tools Ran</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }}>
              {totalActions}
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--success)" }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Avg Response Time</div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }}>
              {avgResponseTime}ms
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Left Side: Live Platforms & Action log */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Active platform quick selector */}
          <div className="glass" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)" }}>Deploy Adapters</h2>
              <button 
                onClick={() => navigate("/platforms")}
                style={{ background: "none", border: "none", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Manage all <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {platforms.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{p.description}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: p.status === "running" ? "var(--success)" : "var(--text-muted)" }}>
                      {p.status.toUpperCase()}
                    </span>
                    <span className={p.status === "running" ? "pulse-success" : "pulse-stopped"} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Log feed */}
          <div className="glass" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)" }}>Recent Actions</h2>
              <button 
                onClick={() => navigate("/actions")}
                style={{ background: "none", border: "none", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                View all logs <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {actions.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "12px", textAlign: "center" }}>
                  No tools executed yet.
                </div>
              ) : (
                actions.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ padding: "4px 8px", background: "rgba(99,102,241,0.1)", borderRadius: "4px", color: "var(--primary)", fontWeight: 600, fontFamily: "monospace" }}>
                        {a.toolName}
                      </span>
                      <span style={{ color: "var(--text-secondary)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {JSON.stringify(a.arguments)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{a.durationMs}ms</span>
                      <span style={{ color: a.status === "success" ? "var(--success)" : "var(--error)" }}>
                        {a.status === "success" ? "●" : "■"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Health Checks */}
        <div className="glass" style={{ padding: "24px", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={18} color="var(--success)" /> Health Monitor
            </h2>
            <span style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "20px",
              background: health.overallStatus === "healthy" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: health.overallStatus === "healthy" ? "var(--success)" : "var(--error)",
              fontWeight: 600
            }}>
              {health.overallStatus.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {health.checks.map((c: any) => (
              <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{c.name}</span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: c.status === "pass" ? "var(--success)" : c.status === "warn" ? "var(--warning)" : "var(--error)"
                  }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{c.message}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate("/health")}
            className="glow-btn"
            style={{ width: "100%", padding: "10px", marginTop: "16px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Activity size={14} /> Full Diagnostic Report
          </button>
        </div>
      </div>
    </div>
  );
};
