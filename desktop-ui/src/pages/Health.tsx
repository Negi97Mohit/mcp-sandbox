import React, { useEffect, useState } from "react";
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  PieChart as PieIcon, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { api } from "../api/bridge.js";

const PIE_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];

// ─── Clipboard helper with Electron fallback ────────────────────────────────
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Reusable Copy Button ────────────────────────────────────────────────────
const CopyButton: React.FC<{ text: string; label?: string; size?: number }> = ({ text, label, size = 13 }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : (label || "Copy")}
      style={{
        background: copied ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.08)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.15)"}`,
        color: copied ? "var(--success)" : "var(--text-muted)",
        borderRadius: "6px",
        padding: label ? "4px 10px" : "4px 6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 500,
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
      onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.color = "var(--text-muted)"; }}}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
};

// ─── Format a single diagnostic check into plain text ────────────────────────
function formatCheck(c: any): string {
  let text = `[${c.status.toUpperCase()}] ${c.name}\n  ${c.message}`;
  if (c.details) text += `\n  Details: ${c.details}`;
  return text;
}

// ─── Format the FULL diagnostics report as text ──────────────────────────────
function formatFullReport(health: any, charts: any): string {
  const lines: string[] = [];
  lines.push("═══════════════════════════════════════");
  lines.push("  MCP SANDBOX — DIAGNOSTICS REPORT");
  lines.push(`  Generated: ${new Date().toLocaleString()}`);
  lines.push("═══════════════════════════════════════");
  lines.push("");

  // Overall status
  lines.push(`Overall Status: ${(health.overallStatus || "unknown").toUpperCase()}`);
  lines.push("");

  // Individual checks
  lines.push("── Live Diagnostics ──");
  if (health.checks?.length) {
    for (const c of health.checks) {
      lines.push(formatCheck(c));
    }
  } else {
    lines.push("  No diagnostic data available.");
  }
  lines.push("");

  // Tool usage
  if (charts.pieData?.length) {
    lines.push("── Tool Usage Breakdown ──");
    for (const entry of charts.pieData) {
      lines.push(`  ${entry.name}: ${entry.value} calls`);
    }
    lines.push("");
  }

  // Usage history
  if (charts.lineData?.length) {
    lines.push("── Usage History (Last 7 Days) ──");
    lines.push("  Date       | Messages | Tools | Errors | Latency");
    lines.push("  -----------|----------|-------|--------|--------");
    for (const d of charts.lineData) {
      lines.push(`  ${d.date || "?"}  |    ${d.messages ?? "-"}    |   ${d.tools ?? "-"}   |   ${d.errors ?? "-"}    |  ${d.responseTime ?? "-"}ms`);
    }
    lines.push("");
  }

  lines.push("═══════════════════════════════════════");
  return lines.join("\n");
}

export const Health: React.FC = () => {
  const [health, setHealth] = useState<any>({ overallStatus: "loading", checks: [] });
  const [charts, setCharts] = useState<any>({ pieData: [], lineData: [] });
  const [loading, setLoading] = useState(true);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const h = await api.runHealthCheck(force);
      const c = await api.getStatsChartData(7);
      setHealth(h);
      setCharts(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }}>
            Diagnostics & Stats
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Monitor real-time sandbox connections, tool response latency, and system reports.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* Copy Full Report */}
          <CopyButton
            text={formatFullReport(health, charts)}
            label="Copy Full Report"
            size={14}
          />
          {/* Refresh */}
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
            Run Health Diagnostics
          </button>
        </div>
      </div>

      {/* Grid: Health Checks & Usage Trends */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left: Health Probes List */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <ShieldCheck size={18} color="var(--success)" /> Live Diagnostics
            </h2>
            {/* Copy all diagnostics */}
            {!loading && health.checks?.length > 0 && (
              <CopyButton
                text={health.checks.map((c: any) => formatCheck(c)).join("\n\n")}
                label="Copy All"
                size={12}
              />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "12px", textAlign: "center" }}>
                Running active diagnostics...
              </div>
            ) : (
              health.checks.map((c: any) => (
                <div 
                  key={c.name} 
                  style={{
                    padding: "14px",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{c.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Copy individual diagnostic */}
                      <CopyButton text={formatCheck(c)} />
                      <span style={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        color: c.status === "pass" ? "var(--success)" : c.status === "warn" ? "var(--warning)" : "var(--error)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {c.status === "pass" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {c.message}
                  </div>
                  {c.details && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.15)", padding: "6px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.02)", marginTop: "4px", wordBreak: "break-all", overflowWrap: "break-word" }}>
                      {c.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Usage LineChart */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <TrendingUp size={18} color="var(--primary)" /> Usage History (Last 7 Days)
            </h2>
            {charts.lineData?.length > 0 && (
              <CopyButton
                text={charts.lineData.map((d: any) => `${d.date}: messages=${d.messages ?? 0}, tools=${d.tools ?? 0}, errors=${d.errors ?? 0}, latency=${d.responseTime ?? 0}ms`).join("\n")}
                label="Copy Data"
                size={12}
              />
            )}
          </div>

          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{
                    background: "rgba(10, 10, 25, 0.95)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text-primary)"
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="messages" name="Messages processed" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="tools" name="Tools executed" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Pie Chart and response times */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "24px" }}>
        
        {/* Left: Pie Chart for Tool Distribution */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <PieIcon size={18} color="var(--secondary)" /> Tool Usage Breakdown
            </h2>
            {charts.pieData?.length > 0 && (
              <CopyButton
                text={charts.pieData.map((e: any) => `${e.name}: ${e.value} calls`).join("\n")}
                label="Copy"
                size={12}
              />
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
            <div style={{ height: "240px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.pieData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: "rgba(10, 10, 25, 0.95)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-primary)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }}>
              {charts.pieData.map((entry: any, index: number) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: PIE_COLORS[index % PIE_COLORS.length],
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "13px", fontWeight: 500, fontFamily: "monospace" }}>{entry.name}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>({entry.value})</span>
                </div>
              ))}
              {charts.pieData.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                  No tools used yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Latency report */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Activity size={18} color="var(--accent)" /> AI Latency Trends
            </h2>
            {charts.lineData?.length > 0 && (
              <CopyButton
                text={charts.lineData.map((d: any) => `${d.date}: ${d.responseTime ?? 0}ms`).join("\n")}
                label="Copy"
                size={12}
              />
            )}
          </div>

          <div style={{ height: "240px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="ms" />
                <Tooltip 
                  contentStyle={{
                    background: "rgba(10, 10, 25, 0.95)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text-primary)"
                  }}
                />
                <Line type="monotone" dataKey="responseTime" name="Avg latency" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
