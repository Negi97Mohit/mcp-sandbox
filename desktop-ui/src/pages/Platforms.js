import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Power, AlertTriangle, CheckCircle, Save, Eye, EyeOff } from "lucide-react";
import { api } from "../api/bridge.js";
export const Platforms = () => {
    const [platforms, setPlatforms] = useState([]);
    const [activePlatform, setActivePlatform] = useState(null);
    const [config, setConfig] = useState({});
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [visibleKeys, setVisibleKeys] = useState({});
    const loadPlatforms = async () => {
        try {
            const p = await api.getPlatforms();
            setPlatforms(p);
            if (p.length > 0 && !activePlatform) {
                selectPlatform(p[0]);
            }
            else if (activePlatform) {
                const refreshed = p.find((x) => x.id === activePlatform.id);
                if (refreshed) {
                    setActivePlatform(refreshed);
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    const selectPlatform = async (p) => {
        setActivePlatform(p);
        setMsg(null);
        try {
            const cfg = await api.getPlatformConfig(p.id);
            setConfig(cfg);
        }
        catch (e) {
            console.error("Failed to load config for " + p.id, e);
            setConfig({});
        }
    };
    useEffect(() => {
        loadPlatforms();
    }, []);
    const handleTogglePower = async (p) => {
        setMsg(null);
        const start = p.status === "stopped" || p.status === "error";
        try {
            if (start) {
                // Start it
                setPlatforms(prev => prev.map(x => x.id === p.id ? { ...x, status: "starting" } : x));
                await api.startPlatform(p.id);
                setMsg({ text: `${p.name} adapter started successfully!`, type: "success" });
            }
            else {
                // Stop it
                setPlatforms(prev => prev.map(x => x.id === p.id ? { ...x, status: "stopping" } : x));
                await api.stopPlatform(p.id);
                setMsg({ text: `${p.name} adapter stopped!`, type: "success" });
            }
            loadPlatforms();
        }
        catch (e) {
            console.error(e);
            setMsg({ text: `Failed to toggle adapter: ${e.message || e}`, type: "error" });
            loadPlatforms();
        }
    };
    const handleSaveConfig = async () => {
        if (!activePlatform)
            return;
        setSaving(true);
        setMsg(null);
        try {
            await api.updatePlatformConfig(activePlatform.id, config);
            setMsg({ text: "Configuration saved successfully!", type: "success" });
            loadPlatforms();
        }
        catch (e) {
            console.error(e);
            setMsg({ text: `Failed to save configuration: ${e.message || e}`, type: "error" });
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }, children: "Platform Adapters" }), _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }, children: "Deploy adapters, manage API integrations, and control chat channels." })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px", alignItems: "start" }, children: [_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: platforms.map(p => {
                            const isActive = activePlatform?.id === p.id;
                            return (_jsxs("div", { onClick: () => selectPlatform(p), className: "glass", style: {
                                    padding: "20px",
                                    cursor: "pointer",
                                    borderColor: isActive ? "var(--primary)" : "var(--border)",
                                    boxShadow: isActive ? "0 0 16px rgba(99, 102, 241, 0.12)" : "none",
                                    borderLeft: isActive ? "4px solid var(--primary)" : "1px solid var(--border)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("span", { style: { fontSize: "24px" }, children: p.icon }), _jsxs("div", { children: [_jsx("h3", { style: { fontSize: "15px", fontWeight: 600 }, children: p.name }), _jsxs("span", { style: { fontSize: "10px", color: "var(--text-secondary)" }, children: [p.id.toUpperCase(), " ADAPTER"] })] })] }), _jsxs("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleTogglePower(p);
                                                }, style: {
                                                    background: p.status === "running" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                                    border: "none",
                                                    color: p.status === "running" ? "var(--error)" : "var(--success)",
                                                    padding: "6px 12px",
                                                    borderRadius: "6px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }, children: [_jsx(Power, { size: 12 }), p.status === "running" ? "Stop" : "Start"] })] }), _jsx("p", { style: { fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }, children: p.description }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "10px", marginTop: "4px" }, children: [_jsx("span", { style: { fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }, children: "Connection Status" }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [_jsx("span", { style: { fontSize: "11px", fontWeight: 600, color: p.status === "running" ? "var(--success)" : p.status === "starting" ? "var(--warning)" : "var(--text-muted)" }, children: p.status.toUpperCase() }), _jsx("span", { className: p.status === "running" ? "pulse-success" : p.status === "error" ? "pulse-error" : "pulse-stopped" })] })] })] }, p.id));
                        }) }), activePlatform ? (_jsxs("div", { className: "glass", style: { padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }, children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("span", { style: { fontSize: "28px" }, children: activePlatform.icon }), _jsxs("div", { children: [_jsxs("h2", { style: { fontSize: "18px", fontWeight: 600 }, children: [activePlatform.name, " Settings"] }), _jsxs("p", { style: { fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }, children: ["Configure secrets and connection variables for the ", activePlatform.name, " bot adapter."] })] })] }) }), msg && (_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    background: msg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                    border: msg.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                                    color: msg.type === "success" ? "var(--success)" : "var(--error)",
                                }, children: [msg.type === "success" ? _jsx(CheckCircle, { size: 16 }) : _jsx(AlertTriangle, { size: 16 }), _jsx("span", { children: msg.text })] })), activePlatform.error && (_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    background: "rgba(245, 158, 11, 0.1)",
                                    border: "1px solid rgba(245, 158, 11, 0.2)",
                                    color: "var(--warning)",
                                }, children: [_jsx(AlertTriangle, { size: 16, style: { flexShrink: 0, marginTop: "2px" } }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: "Adapter Warning / Error" }), _jsx("div", { style: { marginTop: "2px", lineHeight: "1.4" }, children: activePlatform.error })] })] })), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: activePlatform.requiredConfigKeys.length === 0 ? (_jsx("div", { style: { color: "var(--text-secondary)", fontSize: "13px", padding: "12px", textAlign: "center" }, children: "This stub adapter requires no configurations." })) : (activePlatform.requiredConfigKeys.map((key) => {
                                    const isSensitive = key.toLowerCase().includes("token") || key.toLowerCase().includes("password") || key.toLowerCase().includes("key");
                                    const isVisible = !!visibleKeys[key];
                                    const inputType = isSensitive ? (isVisible ? "text" : "password") : "text";
                                    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }, children: key.replace(/_/g, " ") }), _jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center" }, children: [_jsx("input", { type: inputType, value: config[key.toLowerCase()] || "", onChange: (e) => setConfig({ ...config, [key.toLowerCase()]: e.target.value }), placeholder: `Enter ${key}...`, style: {
                                                            width: "100%",
                                                            padding: isSensitive ? "10px 40px 10px 12px" : "10px 12px",
                                                            background: "rgba(0, 0, 0, 0.25)",
                                                            border: "1px solid var(--border)",
                                                            borderRadius: "8px",
                                                            color: "var(--text-primary)",
                                                            fontSize: "13px",
                                                            fontFamily: isSensitive ? "monospace" : "inherit",
                                                            boxSizing: "border-box"
                                                        } }), isSensitive && (_jsx("button", { type: "button", onClick: () => setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] })), style: {
                                                            position: "absolute",
                                                            right: "12px",
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "var(--text-muted)",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            padding: 0
                                                        }, children: isVisible ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) }))] })] }, key));
                                })) }), activePlatform.id === "discord" && (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid var(--border)", paddingTop: "16px" }, children: _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }, children: "ALLOWED USER ID (ADMIN)" }), _jsx("input", { type: "text", value: config.alloweduserid || "", onChange: (e) => setConfig({ ...config, alloweduserid: e.target.value }), placeholder: "Discord User ID...", style: {
                                                padding: "10px 12px",
                                                background: "rgba(0, 0, 0, 0.25)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "8px",
                                                color: "var(--text-primary)",
                                                fontSize: "13px"
                                            } })] }) })), _jsx("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "12px" }, children: _jsxs("button", { onClick: handleSaveConfig, disabled: saving || activePlatform.requiredConfigKeys.length === 0, className: "glow-btn", style: {
                                        padding: "10px 20px",
                                        fontSize: "13px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }, children: [_jsx(Save, { size: 14 }), saving ? "Saving..." : "Save Config"] }) })] })) : (_jsx("div", { className: "glass", style: { padding: "40px", textAlign: "center", color: "var(--text-secondary)" }, children: "Select an adapter from the list to view settings." }))] })] }));
};
//# sourceMappingURL=Platforms.js.map