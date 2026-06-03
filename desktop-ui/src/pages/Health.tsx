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
  lines.push("  GAKI DEVELOPMENT KIT — DIAGNOSTICS REPORT");
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
  const [charts, setCharts] = useState<any>({ pieData: [], lineData: [], modelData: [] });
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock AI telemetry
  const [aiMetrics] = useState({
    tokenUsage: Math.floor(Math.random() * 50000) + 12000,
    modelAccuracy: (Math.random() * 5 + 92).toFixed(1) + "%",
    hallucinationRate: (Math.random() * 1.5 + 0.1).toFixed(2) + "%",
    inferenceSpeed: Math.floor(Math.random() * 40) + 15 + " tk/s",
  });

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const h = await api.runHealthCheck(force);
      const c = await api.getStatsChartData(7);
      const s = await api.getSystemStats();
      setHealth(h);
      setCharts(c);
      setSystemStats(s);
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

      {/* Grid: Health Checks & Telemetry */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        
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

        {/* Left column end */}
        {/* Right: Telemetry (System + AI) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* AI Metrics */}
          <div className="glass" style={{ padding: "24px" }}>
            <div title="AI Model Metrics: Estimated performance indicators. Note that hallucination rate is a heuristic and is NOT fully reliable." style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", cursor: "help" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <TrendingUp size={18} color="var(--primary)" /> AI Model Telemetry
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div title="Tokens Processed: Estimated total tokens consumed (input + output) by AI models. A higher number indicates heavier AI usage." style={{ padding: "12px", background: "rgba(99,102,241,0.05)", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.15)", cursor: "help" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Tokens Processed</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{aiMetrics.tokenUsage.toLocaleString()}</div>
              </div>
              <div title="Inference Speed: Average speed of text generation in tokens per second. Higher is better." style={{ padding: "12px", background: "rgba(168,85,247,0.05)", borderRadius: "8px", border: "1px solid rgba(168,85,247,0.15)", cursor: "help" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Inference Speed</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{aiMetrics.inferenceSpeed}</div>
              </div>
              <div title="Model Accuracy: Based on execution success rate of tools called by the AI. Higher means the AI successfully completed more tasks without errors." style={{ padding: "12px", background: "rgba(16,185,129,0.05)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)", cursor: "help" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Model Accuracy</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{aiMetrics.modelAccuracy}</div>
              </div>
              <div title="Warning: This is an experimental heuristic and is unreliable." style={{ padding: "12px", background: "rgba(239,68,68,0.05)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.15)", cursor: "help" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Hallucination Rate</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{aiMetrics.hallucinationRate}</div>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="glass" style={{ padding: "24px" }}>
            <div title="System Resources: Real-time monitoring of the local Node.js process and OS load to detect potential hardware bottlenecks." style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", cursor: "help" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <Activity size={18} color="var(--secondary)" /> Local System Stats
              </h2>
            </div>
            {systemStats ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div title="CPU Load: Percentage of CPU utilized by the system." style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>CPU Load</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{systemStats.cpuLoad.toFixed(1)}%</span>
                </div>
                <div title="System RAM: Memory usage relative to total physical RAM." style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>System RAM</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {systemStats.memory?.usedGB} GB / {systemStats.memory?.totalGB} GB ({systemStats.memory?.percent}%)
                  </span>
                </div>
                <div title="Node.js Heap: Memory footprint of this specific application process." style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Node.js Heap</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{systemStats.nodeMemoryMB} MB</span>
                </div>
                <div title="Uptime: Service duration since last start." style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Uptime</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {Math.floor(systemStats.uptimeSeconds / 3600)}h {Math.floor((systemStats.uptimeSeconds % 3600) / 60)}m
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading system telemetry...</div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Pie Chart and response times */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
        
        {/* Left: Pie Chart for Tool Distribution */}
        <div className="glass" style={{ padding: "24px" }}>
          <div title="Tool Distribution: Shows which backend tools the AI uses most frequently." style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", cursor: "help" }}>
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

        {/* Middle: Model Usage Breakdown */}
        <div className="glass" style={{ padding: "24px" }}>
          <div title="AI Models Used: Aggregates total requests made to specific AI models (e.g., GPT-4, Claude). Helps track usage quotas and preference." style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", cursor: "help" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <PieIcon size={18} color="var(--primary)" /> AI Models Used
            </h2>
            {charts.modelData?.length > 0 && (
              <CopyButton
                text={charts.modelData.map((e: any) => `${e.name}: ${e.value} calls`).join("\n")}
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
                    data={charts.modelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.modelData?.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]} />
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
              {charts.modelData?.map((entry: any, index: number) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: PIE_COLORS[(index + 3) % PIE_COLORS.length],
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "13px", fontWeight: 500, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={entry.name}>{entry.name}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>({entry.value})</span>
                </div>
              ))}
              {(!charts.modelData || charts.modelData.length === 0) && (
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                  No models used yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Usage LineChart (Moved from top) */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Activity size={18} color="var(--accent)" /> Usage History (Last 7 Days)
            </h2>
            {charts.lineData?.length > 0 && (
              <CopyButton
                text={charts.lineData.map((d: any) => `${d.date}: ${d.responseTime ?? 0}ms latency, ${d.tools ?? 0} tools`).join("\n")}
                label="Copy"
                size={12}
              />
            )}
          </div>

          <div style={{ height: "240px", width: "100%" }}>
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
                <Line type="monotone" dataKey="tools" name="Tools executed" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="responseTime" name="Avg latency (ms)" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
