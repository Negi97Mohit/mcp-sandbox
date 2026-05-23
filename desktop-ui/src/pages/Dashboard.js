import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Activity, Cpu, Users, Zap, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "../api/bridge.js";
export const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pieData: [], lineData: [] });
    const [platforms, setPlatforms] = useState([]);
    const [users, setUsers] = useState([]);
    const [health, setHealth] = useState({ overallStatus: "loading", checks: [] });
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadData = async () => {
        setLoading(true);
        try {
            const p = await api.getPlatforms();
            const u = await api.getUsers();
            const h = await api.runHealthCheck();
            const s = await api.getStatsChartData(7);
            const a = await api.getActions({});
            setPlatforms(p);
            setUsers(u);
            setHealth(h);
            setStats(s);
            setActions(a.slice(0, 5));
        }
        catch (e) {
            console.error("Failed to load dashboard data:", e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    const runningPlatforms = platforms.filter(p => p.status === "running").length;
    const lastLineData = stats.lineData[stats.lineData.length - 1] || {};
    const totalActions = stats.lineData.reduce((acc, cur) => acc + (cur.tools || 0), 0);
    const avgResponseTime = lastLineData.responseTime || 0;
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }, children: "Control Center" }), _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }, children: "Live sandbox metrics and system automation dashboard." })] }), _jsxs("button", { onClick: loadData, disabled: loading, style: {
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
                        }, onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--primary)", onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--border)", children: [_jsx(RefreshCw, { size: 14, className: loading ? "spin" : "", style: { animation: loading ? "spin 1s linear infinite" : "none" } }), "Refresh"] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }, children: [_jsxs("div", { className: "glass", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" }, children: [_jsx("div", { style: { background: "rgba(99, 102, 241, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--primary)" }, children: _jsx(Cpu, { size: 24 }) }), _jsxs("div", { children: [_jsx("div", { style: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }, children: "Active Platforms" }), _jsxs("div", { style: { fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }, children: [runningPlatforms, " ", _jsxs("span", { style: { fontSize: "14px", color: "var(--text-muted)", fontWeight: 400 }, children: ["/ ", platforms.length] })] })] })] }), _jsxs("div", { className: "glass", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" }, children: [_jsx("div", { style: { background: "rgba(168, 85, 247, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--secondary)" }, children: _jsx(Users, { size: 24 }) }), _jsxs("div", { children: [_jsx("div", { style: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }, children: "Permitted Users" }), _jsx("div", { style: { fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }, children: users.length })] })] }), _jsxs("div", { className: "glass", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" }, children: [_jsx("div", { style: { background: "rgba(236, 72, 153, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--accent)" }, children: _jsx(Zap, { size: 24 }) }), _jsxs("div", { children: [_jsx("div", { style: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }, children: "Total Tools Ran" }), _jsx("div", { style: { fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }, children: totalActions })] })] }), _jsxs("div", { className: "glass", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" }, children: [_jsx("div", { style: { background: "rgba(16, 185, 129, 0.15)", padding: "12px", borderRadius: "10px", color: "var(--success)" }, children: _jsx(Clock, { size: 24 }) }), _jsxs("div", { children: [_jsx("div", { style: { color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }, children: "Avg Response Time" }), _jsxs("div", { style: { fontSize: "24px", fontWeight: 700, marginTop: "4px", fontFamily: "var(--font-display)" }, children: [avgResponseTime, "ms"] })] })] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsx("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)" }, children: "Deploy Adapters" }), _jsxs("button", { onClick: () => navigate("/platforms"), style: { background: "none", border: "none", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }, children: ["Manage all ", _jsx(ArrowRight, { size: 14 })] })] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: platforms.map(p => (_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border)" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("span", { style: { fontSize: "20px" }, children: p.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: "14px" }, children: p.name }), _jsx("div", { style: { fontSize: "11px", color: "var(--text-secondary)" }, children: p.description })] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx("span", { style: { fontSize: "11px", fontWeight: 500, color: p.status === "running" ? "var(--success)" : "var(--text-muted)" }, children: p.status.toUpperCase() }), _jsx("span", { className: p.status === "running" ? "pulse-success" : "pulse-stopped" })] })] }, p.id))) })] }), _jsxs("div", { className: "glass", style: { padding: "24px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsx("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)" }, children: "Recent Actions" }), _jsxs("button", { onClick: () => navigate("/actions"), style: { background: "none", border: "none", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }, children: ["View all logs ", _jsx(ArrowRight, { size: 14 })] })] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: actions.length === 0 ? (_jsx("div", { style: { color: "var(--text-muted)", fontSize: "13px", padding: "12px", textAlign: "center" }, children: "No tools executed yet." })) : (actions.map(a => (_jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx("span", { style: { padding: "4px 8px", background: "rgba(99,102,241,0.1)", borderRadius: "4px", color: "var(--primary)", fontWeight: 600, fontFamily: "monospace" }, children: a.toolName }), _jsx("span", { style: { color: "var(--text-secondary)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: JSON.stringify(a.arguments) })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsxs("span", { style: { color: "var(--text-muted)", fontSize: "11px" }, children: [a.durationMs, "ms"] }), _jsx("span", { style: { color: a.status === "success" ? "var(--success)" : "var(--error)" }, children: a.status === "success" ? "●" : "■" })] })] }, a.id)))) })] })] }), _jsxs("div", { className: "glass", style: { padding: "24px", height: "fit-content" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "6px" }, children: [_jsx(ShieldCheck, { size: 18, color: "var(--success)" }), " Health Monitor"] }), _jsx("span", { style: {
                                            fontSize: "11px",
                                            padding: "2px 8px",
                                            borderRadius: "20px",
                                            background: health.overallStatus === "healthy" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                            color: health.overallStatus === "healthy" ? "var(--success)" : "var(--error)",
                                            fontWeight: 600
                                        }, children: health.overallStatus.toUpperCase() })] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: health.checks.map((c) => (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.03)" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "13px", fontWeight: 500 }, children: c.name }), _jsx("span", { style: {
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: c.status === "pass" ? "var(--success)" : c.status === "warn" ? "var(--warning)" : "var(--error)"
                                                    }, children: c.status.toUpperCase() })] }), _jsx("span", { style: { fontSize: "11px", color: "var(--text-secondary)" }, children: c.message })] }, c.name))) }), _jsxs("button", { onClick: () => navigate("/health"), className: "glow-btn", style: { width: "100%", padding: "10px", marginTop: "16px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }, children: [_jsx(Activity, { size: 14 }), " Full Diagnostic Report"] })] })] })] }));
};
//# sourceMappingURL=Dashboard.js.map