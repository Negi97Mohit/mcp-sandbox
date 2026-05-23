import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Activity, ShieldCheck, TrendingUp, PieChart as PieIcon, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { api } from "../api/bridge.js";
const PIE_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
export const Health = () => {
    const [health, setHealth] = useState({ overallStatus: "loading", checks: [] });
    const [charts, setCharts] = useState({ pieData: [], lineData: [] });
    const [loading, setLoading] = useState(true);
    const loadData = async () => {
        setLoading(true);
        try {
            const h = await api.runHealthCheck();
            const c = await api.getStatsChartData(7);
            setHealth(h);
            setCharts(c);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }, children: "Diagnostics & Stats" }), _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }, children: "Monitor real-time sandbox connections, tool response latency, and system reports." })] }), _jsxs("button", { onClick: loadData, disabled: loading, style: {
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
                        }, onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--primary)", onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--border)", children: [_jsx(RefreshCw, { size: 14, className: loading ? "spin" : "", style: { animation: loading ? "spin 1s linear infinite" : "none" } }), "Run Health Diagnostics"] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "24px", alignItems: "start" }, children: [_jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(ShieldCheck, { size: 18, color: "var(--success)" }), " Live Diagnostics"] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: loading ? (_jsx("div", { style: { color: "var(--text-muted)", fontSize: "13px", padding: "12px", textAlign: "center" }, children: "Running active diagnostics..." })) : (health.checks.map((c) => (_jsxs("div", { style: {
                                        padding: "14px",
                                        background: "rgba(255,255,255,0.01)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "8px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px"
                                    }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "13px", fontWeight: 600 }, children: c.name }), _jsxs("span", { style: {
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: c.status === "pass" ? "var(--success)" : c.status === "warn" ? "var(--warning)" : "var(--error)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }, children: [c.status === "pass" ? _jsx(CheckCircle2, { size: 12 }) : _jsx(AlertTriangle, { size: 12 }), c.status.toUpperCase()] })] }), _jsx("div", { style: { fontSize: "12px", color: "var(--text-primary)" }, children: c.message }), c.details && (_jsx("div", { style: { fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.15)", padding: "6px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.02)", marginTop: "4px" }, children: c.details }))] }, c.name)))) })] }), _jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(TrendingUp, { size: 18, color: "var(--primary)" }), " Usage History (Last 7 Days)"] }), _jsx("div", { style: { height: "300px", width: "100%" }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: charts.lineData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "date", stroke: "var(--text-muted)", fontSize: 11, tickLine: false }), _jsx(YAxis, { stroke: "var(--text-muted)", fontSize: 11, tickLine: false }), _jsx(Tooltip, { contentStyle: {
                                                    background: "rgba(10, 10, 25, 0.95)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                    color: "var(--text-primary)"
                                                } }), _jsx(Legend, { verticalAlign: "top", height: 36, iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: "12px" } }), _jsx(Line, { type: "monotone", dataKey: "messages", name: "Messages processed", stroke: "#6366f1", strokeWidth: 2.5, dot: { r: 4 }, activeDot: { r: 6 } }), _jsx(Line, { type: "monotone", dataKey: "tools", name: "Tools executed", stroke: "#a855f7", strokeWidth: 2.5, dot: { r: 4 }, activeDot: { r: 6 } }), _jsx(Line, { type: "monotone", dataKey: "errors", name: "Errors", stroke: "#ef4444", strokeWidth: 1.5, dot: { r: 3 } })] }) }) })] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "24px" }, children: [_jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(PieIcon, { size: 18, color: "var(--secondary)" }), " Tool Usage Breakdown"] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }, children: [_jsx("div", { style: { height: "240px", width: "100%" }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: charts.pieData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 80, paddingAngle: 3, dataKey: "value", children: charts.pieData.map((_entry, index) => (_jsx(Cell, { fill: PIE_COLORS[index % PIE_COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { contentStyle: {
                                                            background: "rgba(10, 10, 25, 0.95)",
                                                            border: "1px solid var(--border)",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            color: "var(--text-primary)"
                                                        } })] }) }) }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }, children: [charts.pieData.map((entry, index) => (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx("span", { style: {
                                                            width: "10px",
                                                            height: "10px",
                                                            borderRadius: "50%",
                                                            background: PIE_COLORS[index % PIE_COLORS.length]
                                                        } }), _jsx("span", { style: { fontSize: "13px", fontWeight: 500, fontFamily: "monospace" }, children: entry.name }), _jsxs("span", { style: { fontSize: "12px", color: "var(--text-muted)" }, children: ["(", entry.value, ")"] })] }, entry.name))), charts.pieData.length === 0 && (_jsx("div", { style: { color: "var(--text-muted)", fontSize: "13px" }, children: "No tools used yet." }))] })] })] }), _jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(Activity, { size: 18, color: "var(--accent)" }), " AI Latency Trends"] }), _jsx("div", { style: { height: "240px", width: "100%" }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: charts.lineData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "date", stroke: "var(--text-muted)", fontSize: 11, tickLine: false }), _jsx(YAxis, { stroke: "var(--text-muted)", fontSize: 11, tickLine: false, unit: "ms" }), _jsx(Tooltip, { contentStyle: {
                                                    background: "rgba(10, 10, 25, 0.95)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                    color: "var(--text-primary)"
                                                } }), _jsx(Line, { type: "monotone", dataKey: "responseTime", name: "Avg latency", stroke: "#ec4899", strokeWidth: 2.5, dot: { r: 4 }, activeDot: { r: 6 } })] }) }) })] })] })] }));
};
//# sourceMappingURL=Health.js.map