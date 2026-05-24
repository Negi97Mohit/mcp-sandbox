import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Cpu,
    Users,
    MessageSquare,
    History,
    Activity,
    Settings as SettingsIcon,
    FolderOpen,
    Wrench,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { api } from "../api/bridge.js";
import AppLogo from "./AppLogo.js";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [adapterError, setAdapterError] = useState<{ id: string; name: string; error: string } | null>(null);
    const [theme, setTheme] = useState(() => localStorage.getItem("mcp-theme") || "glass");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem("mcp-sidebar-collapsed") === "true");

    useEffect(() => {
        api.isMaximized().then(setIsMaximized).catch(() => {});
        api.onMaximizeChange((val: boolean) => setIsMaximized(val));
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
                const errored = platforms.find((p: any) => p.status === "error" && p.error);
                if (errored) {
                    setAdapterError({ id: errored.id, name: errored.name, error: errored.error });
                } else {
                    setAdapterError(null);
                }
            } catch (e) {
                console.error("Layout: Failed to fetch platform status:", e);
            }
        };
        checkPlatforms();
        const interval = setInterval(checkPlatforms, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", backgroundColor: "var(--bg-deep)", overflow: "hidden" }}>
            {/* Custom Frameless Titlebar */}
            <div style={{
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
            } as any}>
                {/* macOS-style traffic light buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", WebkitAppRegion: "no-drag" } as any}>
                    <TrafficButton
                        color="rgba(255, 95, 86, 0.15)"
                        borderColor="rgba(255, 95, 86, 0.35)"
                        glowColor="rgba(255, 95, 86, 0.65)"
                        coreColor="#FF5F56"
                        title="Close"
                        onClick={() => api.closeWindow()}
                    >
                        <svg width="6" height="6" viewBox="0 0 6 6">
                            <line x1="1" y1="1" x2="5" y2="5" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="5" y1="1" x2="1" y2="5" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </TrafficButton>
                    <TrafficButton
                        color="rgba(255, 189, 46, 0.15)"
                        borderColor="rgba(255, 189, 46, 0.35)"
                        glowColor="rgba(255, 189, 46, 0.65)"
                        coreColor="#FFBD2E"
                        title="Minimize"
                        onClick={() => api.minimize()}
                    >
                        <svg width="6" height="6" viewBox="0 0 6 6">
                            <line x1="1" y1="3" x2="5" y2="3" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </TrafficButton>
                    <TrafficButton
                        color="rgba(39, 201, 63, 0.15)"
                        borderColor="rgba(39, 201, 63, 0.35)"
                        glowColor="rgba(39, 201, 63, 0.65)"
                        coreColor="#27C93F"
                        title={isMaximized ? "Restore" : "Maximize"}
                        onClick={() => api.maximize()}
                    >
                        {isMaximized ? (
                            <svg width="6" height="6" viewBox="0 0 6 6">
                                <path d="M2 1H5V4M1 2V5H4" stroke="rgba(0,0,0,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        ) : (
                            <svg width="6" height="6" viewBox="0 0 6 6">
                                <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="rgba(0,0,0,0.7)" strokeWidth="1.3" fill="none" />
                            </svg>
                        )}
                    </TrafficButton>

                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                        style={{
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
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        {isSidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                    </button>
                </div>

                {/* App title — centered absolutely */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    position: "absolute", left: "50%", transform: "translateX(-50%)",
                    pointerEvents: "none",
                }}>
                    <AppLogo size={16} color="var(--primary)" strokeWidth={5} />
                    <span style={{
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px",
                        letterSpacing: "2.5px", color: "var(--text-titlebar)", textTransform: "uppercase",
                    }}>
                        Gaki - Development Kit
                    </span>
                    <span style={{
                        fontSize: "9px", padding: "1px 6px",
                        background: "rgba(99,102,241,0.2)", borderRadius: "10px",
                        color: "var(--primary)", fontWeight: 600, letterSpacing: "0.5px",
                    }}>
                        v1.0
                    </span>
                </div>

                {/* Right Area: Theme Switcher */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", WebkitAppRegion: "no-drag" } as any}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }}>THEME:</span>
                    <select 
                        value={theme} 
                        onChange={(e) => {
                            const newTheme = e.target.value;
                            setTheme(newTheme);
                            localStorage.setItem("mcp-theme", newTheme);
                        }}
                        style={{
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
                        }}
                    >
                        <optgroup label="Core Themes" style={{ background: "var(--bg-deep)" }}>
                            <option value="glass" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>✨ Glass (Default)</option>
                            <option value="brutalist" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🎨 Neo-Brutalist</option>
                            <option value="light" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>☀️ Chic Light</option>
                            <option value="chic" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>☕ Retro Chic</option>
                            <option value="minimal" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🔳 Ultra-Minimal</option>
                            <option value="modern" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🌌 Futuristic Modern</option>
                            <option value="dracula" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🧛 Dracula Gothic</option>
                            <option value="cyberpunk" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>⚡ Cyberpunk Hacker</option>
                            <option value="nordic" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>❄️ Nordic Frost</option>
                            <option value="brutalist-mono" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>📟 Stark Mono</option>
                            <option value="solarized-dark" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>📟 Solarized Dark</option>
                            <option value="glass-emerald" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🌿 Glass Emerald</option>
                            <option value="synthwave" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🎸 Synthwave Retro</option>
                            <option value="minimal-warm" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🌾 Minimal Warm</option>
                            <option value="vogue" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🖤 Vogue Editorial</option>
                            <option value="abyss" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🐙 Deep Abyss</option>
                        </optgroup>
                        <optgroup label="AI Agent Themes" style={{ background: "var(--bg-deep)" }}>
                            <option value="google-ai" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🔵 Google AI Studio (Snappy)</option>
                            <option value="claude" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>📙 Claude (Thocky)</option>
                            <option value="openai" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🟢 OpenAI (Bubblegummy)</option>
                            <option value="codex" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>⬛ Codex (Rigid Terminal)</option>
                            <option value="deepseek" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>🐋 DeepSeek (Fluid Ocean)</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Global Diagnostic Error Banner */}
            {adapterError && (
                <div style={{
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
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <AlertTriangle size={15} color="var(--error)" style={{ flexShrink: 0 }} />
                        <span>
                            <strong>{adapterError.name} Adapter Error:</strong> {adapterError.error}. Your agent AI or connection is offline.
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <NavLink 
                            to="/platforms" 
                            style={{
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
                            }}
                        >
                            Configure & Debug
                        </NavLink>
                        <button 
                            onClick={() => setAdapterError(null)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "rgba(254, 202, 202, 0.6)",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "2px 6px"
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Main body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Sidebar */}
                <div style={{
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
                }}>
                    <SidebarSection label="Overview" />
                    <SidebarLink to="/" icon={<LayoutDashboard size={15} />} label="Dashboard" end />
                    <SidebarLink to="/platforms" icon={<Cpu size={15} />} label="Platforms" />
                    <SidebarLink to="/users" icon={<Users size={15} />} label="Users & Access" />

                    <SidebarSection label="Agent Console" />
                    <SidebarLink to="/chat" icon={<MessageSquare size={15} />} label="Agent Chat" />
                    <SidebarLink to="/actions" icon={<History size={15} />} label="Action History" />
                    <SidebarLink to="/health" icon={<Activity size={15} />} label="Health & Stats" />

                    <SidebarSection label="Developer" />
                    <SidebarLink to="/workspaces" icon={<FolderOpen size={15} />} label="Workspaces" />
                    <SidebarLink to="/custom-tools" icon={<Wrench size={15} />} label="Custom Tools" />

                    <div style={{ flex: 1 }} />
                    <div style={{ height: "1px", background: "var(--border-sidebar)", margin: "8px 2px" }} />
                    <SidebarLink to="/settings" icon={<SettingsIcon size={15} />} label="Settings" />
                </div>

                {/* Page area */}
                <div style={{ 
                    flex: 1, 
                    overflowY: "auto", 
                    backgroundColor: "var(--bg-page)", 
                    transition: "background 0.2s ease-out",
                    padding: "24px",
                    boxSizing: "border-box"
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// macOS-style glassmorphic traffic light button
const TrafficButton: React.FC<{
    color: string;
    borderColor: string;
    glowColor: string;
    coreColor: string;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ color, borderColor, glowColor, coreColor, title, onClick, children }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            title={title}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
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
            }}
        >
            {/* The small central glowing dot when not hovered */}
            <span style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: coreColor,
                opacity: hovered ? 0 : 0.85,
                transition: "opacity 0.15s ease",
                position: "absolute",
                boxShadow: `0 0 3px ${coreColor}`,
            }} />

            {/* The SVG icons appearing on hover */}
            <span style={{ 
                opacity: hovered ? 1 : 0, 
                transition: "opacity 0.15s ease", 
                display: "flex",
                transform: hovered ? "scale(1)" : "scale(0.8)",
                zIndex: 1,
            }}>
                {children}
            </span>
        </button>
    );
};

const SidebarSection: React.FC<{ label: string }> = ({ label }) => (
    <div style={{
        color: "var(--text-muted)",
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        padding: "14px 10px 5px",
        opacity: 0.7,
    }}>
        {label}
    </div>
);

interface SidebarLinkProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    end?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, end }) => {
    return (
        <NavLink
            to={to}
            end={end}
            style={({ isActive }) => ({
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
                transition: "all var(--transition-speed) var(--transition-curve)",
                marginBottom: "1px",
                opacity: isActive ? 1 : 0.75,
            })}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.style.background.includes("var(--sidebar-active-bg")) {
                    el.style.opacity = "1";
                }
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.style.background.includes("var(--sidebar-active-bg")) {
                    el.style.opacity = "0.75";
                }
            }}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
};
