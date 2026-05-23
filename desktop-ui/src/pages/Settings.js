import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Save, Key, AppWindow, CheckCircle, AlertTriangle, ShieldCheck, Palette, Eye, EyeOff } from "lucide-react";
import { api } from "../api/bridge.js";
export const Settings = () => {
    const [env, setEnv] = useState({});
    const [models, setModels] = useState([]);
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem("mcp-theme") || "glass");
    const [msg, setMsg] = useState(null);
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [showNetlifyToken, setShowNetlifyToken] = useState(false);
    const loadData = async () => {
        try {
            const e = await api.getConfig();
            const m = await api.getAvailableModels();
            const al = await api.getAutoLaunch();
            setEnv(e);
            setModels(m);
            setAutoLaunch(al);
        }
        catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await api.updateConfig(env);
            await api.setAutoLaunch(autoLaunch);
            setMsg({ text: "Configurations saved and loaded successfully!", type: "success" });
            loadData();
        }
        catch (err) {
            console.error(err);
            setMsg({ text: `Failed to save configurations: ${err.message || err}`, type: "error" });
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }, children: "Platform Settings" }), _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }, children: "Manage global environment configurations, model parameters, and desktop auto-startup rules." })] }), msg && (_jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: msg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: msg.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                    color: msg.type === "success" ? "var(--success)" : "var(--error)",
                }, children: [msg.type === "success" ? _jsx(CheckCircle, { size: 16 }) : _jsx(AlertTriangle, { size: 16 }), _jsx("span", { children: msg.text })] })), _jsxs("form", { onSubmit: handleSave, style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { className: "glass", style: { padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(Key, { size: 18, color: "var(--primary)" }), " API Credentials"] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }, children: "OPENROUTER API KEY" }), _jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center" }, children: [_jsx("input", { type: showOpenRouterKey ? "text" : "password", value: env.OPENROUTER_API_KEY || "", onChange: (e) => setEnv({ ...env, OPENROUTER_API_KEY: e.target.value }), placeholder: "Enter OpenRouter API Key...", style: {
                                                            width: "100%",
                                                            padding: "10px 40px 10px 12px",
                                                            background: "rgba(0, 0, 0, 0.25)",
                                                            border: "1px solid var(--border)",
                                                            borderRadius: "8px",
                                                            color: "var(--text-primary)",
                                                            fontSize: "13px",
                                                            fontFamily: "monospace",
                                                            boxSizing: "border-box"
                                                        } }), _jsx("button", { type: "button", onClick: () => setShowOpenRouterKey(!showOpenRouterKey), style: {
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
                                                        }, children: showOpenRouterKey ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }, children: "NETLIFY PERSONAL TOKEN" }), _jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center" }, children: [_jsx("input", { type: showNetlifyToken ? "text" : "password", value: env.NETLIFY_TOKEN || "", onChange: (e) => setEnv({ ...env, NETLIFY_TOKEN: e.target.value }), placeholder: "Enter Netlify API Token...", style: {
                                                            width: "100%",
                                                            padding: "10px 40px 10px 12px",
                                                            background: "rgba(0, 0, 0, 0.25)",
                                                            border: "1px solid var(--border)",
                                                            borderRadius: "8px",
                                                            color: "var(--text-primary)",
                                                            fontSize: "13px",
                                                            fontFamily: "monospace",
                                                            boxSizing: "border-box"
                                                        } }), _jsx("button", { type: "button", onClick: () => setShowNetlifyToken(!showNetlifyToken), style: {
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
                                                        }, children: showNetlifyToken ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] })] })] })] }), _jsxs("div", { className: "glass", style: { padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(ShieldCheck, { size: 18, color: "var(--secondary)" }), " AI Model Parameter"] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsx("label", { style: { fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }, children: "Active Thinking Model" }), _jsx("select", { value: env.MODEL_NAME || "", onChange: (e) => setEnv({ ...env, MODEL_NAME: e.target.value }), style: {
                                            padding: "10px 12px",
                                            background: "rgba(0, 0, 0, 0.25)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "8px",
                                            color: "var(--text-primary)",
                                            fontSize: "13px"
                                        }, children: models.map(m => (_jsx("option", { value: m.id, children: m.name }, m.id))) })] })] }), _jsxs("div", { className: "glass", style: { padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(AppWindow, { size: 18, color: "var(--accent)" }), " Desktop Preferences"] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: "13.5px", fontWeight: 600 }, children: "Auto-launch on startup" }), _jsx("div", { style: { fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }, children: "Automatically launch the Sandbox Control Panel when the computer boots up." })] }), _jsx("div", { onClick: () => setAutoLaunch(!autoLaunch), style: {
                                            width: "48px",
                                            height: "26px",
                                            background: autoLaunch ? "var(--primary)" : "rgba(255,255,255,0.1)",
                                            borderRadius: "20px",
                                            padding: "3px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: autoLaunch ? "flex-end" : "flex-start",
                                            transition: "background 0.2s"
                                        }, children: _jsx("div", { style: {
                                                width: "20px",
                                                height: "20px",
                                                background: "white",
                                                borderRadius: "50%",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                            } }) })] })] }), _jsxs("div", { className: "glass", style: { padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }, children: [_jsxs("h2", { style: { fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(Palette, { size: 18, color: "var(--primary)" }), " Visual Styling & Themes"] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }, children: [
                                    { id: "glass", name: "Default Glass", desc: "Semi-transparent dark glassmorphism", icon: "✨" },
                                    { id: "brutalist", name: "Neo-Brutalist", desc: "High contrast yellow & solid outlines", icon: "🎨" },
                                    { id: "light", name: "Chic Light", desc: "Soft slate and clean light panels", icon: "☀️" },
                                    { id: "chic", name: "Retro Chic", desc: "Warm vintage cream and sage tones", icon: "☕" },
                                    { id: "minimal", name: "Ultra-Minimal", desc: "Solid monochrome pure minimalism", icon: "🔳" },
                                    { id: "modern", name: "Futuristic Modern", desc: "Neon cyan/indigo cybernetic glow", icon: "🌌" },
                                ].map(t => {
                                    const isSel = theme === t.id;
                                    return (_jsxs("div", { onClick: () => {
                                            setTheme(t.id);
                                            localStorage.setItem("mcp-theme", t.id);
                                            document.documentElement.setAttribute("data-theme", t.id);
                                        }, style: {
                                            padding: "16px",
                                            borderRadius: "10px",
                                            border: isSel ? "2px solid var(--primary)" : "1px solid var(--border)",
                                            background: isSel ? "rgba(99, 102, 241, 0.08)" : "rgba(0,0,0,0.15)",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "6px"
                                        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13.5px" }, children: [_jsx("span", { children: t.icon }), _jsx("span", { children: t.name })] }), _jsx("div", { style: { fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }, children: t.desc })] }, t.id));
                                }) })] }), _jsx("div", { style: { display: "flex", justifyContent: "flex-end" }, children: _jsxs("button", { type: "submit", disabled: saving, className: "glow-btn", style: {
                                padding: "12px 28px",
                                fontSize: "13.5px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }, children: [_jsx(Save, { size: 14 }), saving ? "Saving settings..." : "Save Settings"] }) })] })] }));
};
//# sourceMappingURL=Settings.js.map