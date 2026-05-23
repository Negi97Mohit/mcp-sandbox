import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Cpu, Users, MessageSquare, History, Activity, Settings as SettingsIcon, Bot, FolderOpen, Wrench, AlertTriangle, ChevronLeft, ChevronRight, } from "lucide-react";
import { api } from "../api/bridge.js";
export const Layout = ({ children }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [adapterError, setAdapterError] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem("mcp-theme") || "glass");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem("mcp-sidebar-collapsed") === "true");
    useEffect(() => {
        api.isMaximized().then(setIsMaximized).catch(() => { });
        api.onMaximizeChange((val) => setIsMaximized(val));
    }, []);
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);
    useEffect(() => {
        localStorage.setItem("mcp-sidebar-collapsed", String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);
    useEffect(() => {
        const checkPlatforms = async () => {
            try {
                const platforms = await api.getPlatforms();
                const errored = platforms.find((p) => p.status === "error" && p.error);
                if (errored) {
                    setAdapterError({ id: errored.id, name: errored.name, error: errored.error });
                }
                else {
                    setAdapterError(null);
                }
            }
            catch (e) {
                console.error("Layout: Failed to fetch platform status:", e);
            }
        };
        checkPlatforms();
        const interval = setInterval(checkPlatforms, 5000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100vh", width: "100vw", backgroundColor: "var(--bg-deep)", overflow: "hidden" }, children: [_jsxs("div", { style: {
                    height: "40px",
                    minHeight: "40px",
                    background: "var(--bg-titlebar)",
                    borderBottom: "1px solid var(--border-titlebar)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 16px",
                    WebkitAppRegion: "drag",
                    userSelect: "none",
                    flexShrink: 0,
                    zIndex: 1000,
                    position: "relative",
                    transition: "all 0.2s ease-out",
                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", WebkitAppRegion: "no-drag" }, children: [_jsx(TrafficButton, { color: "rgba(255, 95, 86, 0.15)", borderColor: "rgba(255, 95, 86, 0.35)", glowColor: "rgba(255, 95, 86, 0.65)", coreColor: "#FF5F56", title: "Close", onClick: () => api.closeWindow(), children: _jsxs("svg", { width: "6", height: "6", viewBox: "0 0 6 6", children: [_jsx("line", { x1: "1", y1: "1", x2: "5", y2: "5", stroke: "rgba(0,0,0,0.7)", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("line", { x1: "5", y1: "1", x2: "1", y2: "5", stroke: "rgba(0,0,0,0.7)", strokeWidth: "1.5", strokeLinecap: "round" })] }) }), _jsx(TrafficButton, { color: "rgba(255, 189, 46, 0.15)", borderColor: "rgba(255, 189, 46, 0.35)", glowColor: "rgba(255, 189, 46, 0.65)", coreColor: "#FFBD2E", title: "Minimize", onClick: () => api.minimize(), children: _jsx("svg", { width: "6", height: "6", viewBox: "0 0 6 6", children: _jsx("line", { x1: "1", y1: "3", x2: "5", y2: "3", stroke: "rgba(0,0,0,0.7)", strokeWidth: "1.5", strokeLinecap: "round" }) }) }), _jsx(TrafficButton, { color: "rgba(39, 201, 63, 0.15)", borderColor: "rgba(39, 201, 63, 0.35)", glowColor: "rgba(39, 201, 63, 0.65)", coreColor: "#27C93F", title: isMaximized ? "Restore" : "Maximize", onClick: () => api.maximize(), children: isMaximized ? (_jsx("svg", { width: "6", height: "6", viewBox: "0 0 6 6", children: _jsx("path", { d: "M2 1H5V4M1 2V5H4", stroke: "rgba(0,0,0,0.7)", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }) })) : (_jsx("svg", { width: "6", height: "6", viewBox: "0 0 6 6", children: _jsx("rect", { x: "1", y: "1", width: "4", height: "4", rx: "0.5", stroke: "rgba(0,0,0,0.7)", strokeWidth: "1.3", fill: "none" }) })) }), _jsx("button", { onClick: () => setIsSidebarCollapsed(!isSidebarCollapsed), title: isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar", style: {
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid var(--border-sidebar)",
                                    borderRadius: "6px",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "4px",
                                    marginLeft: "10px",
                                    transition: "all 0.2s ease",
                                    outline: "none",
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                }, children: isSidebarCollapsed ? _jsx(ChevronRight, { size: 13 }) : _jsx(ChevronLeft, { size: 13 }) })] }), _jsxs("div", { style: {
                            display: "flex", alignItems: "center", gap: "8px",
                            position: "absolute", left: "50%", transform: "translateX(-50%)",
                            pointerEvents: "none",
                        }, children: [_jsx(Bot, { size: 15, color: "var(--primary)" }), _jsx("span", { style: {
                                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px",
                                    letterSpacing: "2.5px", color: "var(--text-titlebar)", textTransform: "uppercase",
                                }, children: "MCP Sandbox" }), _jsx("span", { style: {
                                    fontSize: "9px", padding: "1px 6px",
                                    background: "rgba(99,102,241,0.2)", borderRadius: "10px",
                                    color: "var(--primary)", fontWeight: 600, letterSpacing: "0.5px",
                                }, children: "v1.0" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", WebkitAppRegion: "no-drag" }, children: [_jsx("span", { style: { fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }, children: "THEME:" }), _jsxs("select", { value: theme, onChange: (e) => {
                                    const newTheme = e.target.value;
                                    setTheme(newTheme);
                                    localStorage.setItem("mcp-theme", newTheme);
                                }, style: {
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "6px",
                                    color: "var(--text-primary)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    outline: "none",
                                    fontFamily: "var(--font-sans)",
                                }, children: [_jsx("option", { value: "glass", style: { background: "var(--bg-surface)", color: "var(--text-primary)" }, children: "\u2728 Glass" }), _jsx("option", { value: "brutalist", style: { background: "var(--bg-surface)", color: "var(--text-primary)" }, children: "\uD83C\uDFA8 Brutalist" }), _jsx("option", { value: "light", style: { background: "var(--bg-surface)", color: "var(--text-primary)" }, children: "\u2600\uFE0F Light" }), _jsx("option", { value: "chic", style: { background: "var(--bg-surface)", color: "var(--text-primary)" }, children: "\u2615 Retro Chic" }), _jsx("option", { value: "minimal", style: { background: "var(--bg-surface)", color: "var(--text-primary)" }, children: "\uD83D\uDD33 Minimal" }), _jsx("option", { value: "modern", style: { background: "var(--bg-surface)", color: "var(--text-primary)" }, children: "\uD83C\uDF0C Modern" })] })] })] }), adapterError && (_jsxs("div", { style: {
                    background: "linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(168, 85, 247, 0.12) 100%)",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.35)",
                    padding: "10px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#fecaca",
                    fontSize: "12.5px",
                    zIndex: 999,
                    animation: "fadeIn 0.25s ease-out",
                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx(AlertTriangle, { size: 15, color: "var(--error)", style: { flexShrink: 0 } }), _jsxs("span", { children: [_jsxs("strong", { children: [adapterError.name, " Adapter Error:"] }), " ", adapterError.error, ". Your agent AI or connection is offline."] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx(NavLink, { to: "/platforms", style: {
                                    background: "rgba(239, 68, 68, 0.25)",
                                    border: "1px solid rgba(239, 68, 68, 0.4)",
                                    color: "#ff8a8a",
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }, children: "Configure & Debug" }), _jsx("button", { onClick: () => setAdapterError(null), style: {
                                    background: "transparent",
                                    border: "none",
                                    color: "rgba(254, 202, 202, 0.6)",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    padding: "2px 6px"
                                }, children: "\u2715" })] })] })), _jsxs("div", { style: { display: "flex", flex: 1, overflow: "hidden" }, children: [_jsxs("div", { style: {
                            width: isSidebarCollapsed ? "0px" : "220px",
                            minWidth: isSidebarCollapsed ? "0px" : "220px",
                            background: "var(--bg-sidebar)",
                            borderRight: isSidebarCollapsed ? "none" : "1px solid var(--border-sidebar)",
                            display: "flex",
                            flexDirection: "column",
                            padding: isSidebarCollapsed ? "0px" : "10px 10px",
                            gap: "2px",
                            overflowY: "auto",
                            overflowX: "hidden",
                            transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease-out, background 0.25s ease-out",
                        }, children: [_jsx(SidebarSection, { label: "Overview" }), _jsx(SidebarLink, { to: "/", icon: _jsx(LayoutDashboard, { size: 15 }), label: "Dashboard", end: true }), _jsx(SidebarLink, { to: "/platforms", icon: _jsx(Cpu, { size: 15 }), label: "Platforms" }), _jsx(SidebarLink, { to: "/users", icon: _jsx(Users, { size: 15 }), label: "Users & Access" }), _jsx(SidebarSection, { label: "Agent Console" }), _jsx(SidebarLink, { to: "/chat", icon: _jsx(MessageSquare, { size: 15 }), label: "Agent Chat" }), _jsx(SidebarLink, { to: "/actions", icon: _jsx(History, { size: 15 }), label: "Action History" }), _jsx(SidebarLink, { to: "/health", icon: _jsx(Activity, { size: 15 }), label: "Health & Stats" }), _jsx(SidebarSection, { label: "Developer" }), _jsx(SidebarLink, { to: "/workspaces", icon: _jsx(FolderOpen, { size: 15 }), label: "Workspaces" }), _jsx(SidebarLink, { to: "/custom-tools", icon: _jsx(Wrench, { size: 15 }), label: "Custom Tools" }), _jsx("div", { style: { flex: 1 } }), _jsx("div", { style: { height: "1px", background: "var(--border-sidebar)", margin: "8px 2px" } }), _jsx(SidebarLink, { to: "/settings", icon: _jsx(SettingsIcon, { size: 15 }), label: "Settings" })] }), _jsx("div", { style: {
                            flex: 1,
                            overflowY: "auto",
                            backgroundColor: "var(--bg-page)",
                            transition: "background 0.2s ease-out",
                            padding: "24px",
                            boxSizing: "border-box"
                        }, children: children })] })] }));
};
// macOS-style glassmorphic traffic light button
const TrafficButton = ({ color, borderColor, glowColor, coreColor, title, onClick, children }) => {
    const [hovered, setHovered] = useState(false);
    return (_jsxs("button", { title: title, onClick: onClick, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), style: {
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: hovered ? coreColor : color,
            border: hovered ? `1px solid ${coreColor}` : `1px solid ${borderColor}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
            backdropFilter: "blur(4px)",
            boxShadow: hovered
                ? `0 0 8px ${glowColor}, inset 0 1px 1px rgba(255,255,255,0.3)`
                : `0 1px 2px rgba(0,0,0,0.15)`,
            position: "relative",
        }, children: [_jsx("span", { style: {
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: coreColor,
                    opacity: hovered ? 0 : 0.85,
                    transition: "opacity 0.15s ease",
                    position: "absolute",
                    boxShadow: `0 0 3px ${coreColor}`,
                } }), _jsx("span", { style: {
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.15s ease",
                    display: "flex",
                    transform: hovered ? "scale(1)" : "scale(0.8)",
                    zIndex: 1,
                }, children: children })] }));
};
const SidebarSection = ({ label }) => (_jsx("div", { style: {
        color: "var(--text-muted)",
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        padding: "14px 10px 5px",
        opacity: 0.7,
    }, children: label }));
const SidebarLink = ({ to, icon, label, end }) => {
    return (_jsxs(NavLink, { to: to, end: end, style: ({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: isActive ? 600 : 400,
            borderRadius: "7px",
            background: isActive
                ? "var(--sidebar-active-bg, linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.07)))"
                : "transparent",
            borderLeft: isActive ? "2px solid var(--primary)" : "2px solid transparent",
            transition: "all 0.15s ease",
            marginBottom: "1px",
            opacity: isActive ? 1 : 0.75,
        }), onMouseEnter: (e) => {
            const el = e.currentTarget;
            if (!el.style.background.includes("var(--sidebar-active-bg")) {
                el.style.opacity = "1";
            }
        }, onMouseLeave: (e) => {
            const el = e.currentTarget;
            if (!el.style.background.includes("var(--sidebar-active-bg")) {
                el.style.opacity = "0.75";
            }
        }, children: [icon, _jsx("span", { children: label })] }));
};
//# sourceMappingURL=Layout.js.map