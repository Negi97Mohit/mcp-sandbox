import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, User, Copy } from "lucide-react";
import { api } from "../api/bridge.js";
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };
    return (_jsxs("button", { onClick: handleCopy, style: {
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
        }, title: "Copy to clipboard", onMouseEnter: (e) => {
            if (!copied)
                e.currentTarget.style.borderColor = "var(--primary)";
        }, onMouseLeave: (e) => {
            if (!copied)
                e.currentTarget.style.borderColor = "var(--border)";
        }, children: [copied ? _jsx(CheckCircle, { size: 12, color: "var(--success)" }) : _jsx(Copy, { size: 12 }), _jsx("span", { children: copied ? "Copied!" : "Copy" })] }));
};
export const Actions = () => {
    const [actions, setActions] = useState([]);
    const [filterTool, setFilterTool] = useState("");
    const [filterPlatform, setFilterPlatform] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const loadActions = async () => {
        setLoading(true);
        try {
            const data = await api.getActions({
                toolName: filterTool || undefined,
                platform: filterPlatform || undefined,
            });
            setActions(data);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadActions();
    }, [filterTool, filterPlatform]);
    const toggleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        }
        else {
            setExpandedId(id);
        }
    };
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }, children: "Action Logs" }), _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }, children: "Inspect absolute historical logs for every DevOps tool run by the AI agent." })] }), _jsxs("div", { className: "glass", style: { padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }, children: [_jsx(Search, { size: 16, color: "var(--text-muted)" }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx("span", { style: { fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }, children: "Tool Name:" }), _jsxs("select", { value: filterTool, onChange: (e) => setFilterTool(e.target.value), style: {
                                    background: "rgba(0,0,0,0.3)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    fontSize: "12.5px"
                                }, children: [_jsx("option", { value: "", children: "All Tools" }), _jsx("option", { value: "run_shell", children: "run_shell" }), _jsx("option", { value: "write_file", children: "write_file" }), _jsx("option", { value: "read_file", children: "read_file" }), _jsx("option", { value: "list_dir", children: "list_dir" }), _jsx("option", { value: "netlify_deploy", children: "netlify_deploy" }), _jsx("option", { value: "netlify_status", children: "netlify_status" })] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx("span", { style: { fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }, children: "Origin Channel:" }), _jsxs("select", { value: filterPlatform, onChange: (e) => setFilterPlatform(e.target.value), style: {
                                    background: "rgba(0,0,0,0.3)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    fontSize: "12.5px"
                                }, children: [_jsx("option", { value: "", children: "All Channels" }), _jsx("option", { value: "discord", children: "Discord Chat" }), _jsx("option", { value: "desktop-ui", children: "Desktop App" })] })] })] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: loading ? (_jsx("div", { className: "glass", style: { padding: "40px", textAlign: "center", color: "var(--text-muted)" }, children: "Loading historical logs..." })) : actions.length === 0 ? (_jsx("div", { className: "glass", style: { padding: "40px", textAlign: "center", color: "var(--text-muted)" }, children: "No matching action logs found." })) : (actions.map(a => {
                    const isExpanded = expandedId === a.id;
                    return (_jsxs("div", { className: "glass", style: {
                            padding: "16px 20px",
                            borderColor: isExpanded ? "var(--primary)" : "var(--border)",
                            transition: "all 0.2s"
                        }, children: [_jsxs("div", { onClick: () => toggleExpand(a.id), style: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "16px" }, children: [a.status === "success" ? (_jsx(CheckCircle, { size: 18, color: "var(--success)" })) : (_jsx(XCircle, { size: 18, color: "var(--error)" })), _jsx("span", { style: {
                                                    fontFamily: "monospace",
                                                    fontWeight: 700,
                                                    fontSize: "13px",
                                                    color: "var(--primary)",
                                                    padding: "2px 8px",
                                                    background: "rgba(99,102,241,0.08)",
                                                    borderRadius: "4px"
                                                }, children: a.toolName }), _jsxs("span", { style: { fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }, children: [_jsx(Clock, { size: 12 }), " ", a.durationMs, "ms"] }), _jsxs("span", { style: { fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }, children: [_jsx(User, { size: 12 }), " ", a.userId === "desktop-admin" ? "Admin" : a.userId] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("span", { style: {
                                                    fontSize: "10px",
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                    background: a.platform === "discord" ? "rgba(99,102,241,0.12)" : "rgba(168,85,247,0.12)",
                                                    color: a.platform === "discord" ? "var(--primary)" : "var(--secondary)"
                                                }, children: a.platform.toUpperCase() }), _jsx("span", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: new Date(a.timestamp).toLocaleTimeString() }), isExpanded ? _jsx(ChevronUp, { size: 16 }) : _jsx(ChevronDown, { size: 16 })] })] }), isExpanded && (_jsxs("div", { style: { marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }, children: "Call Arguments" }), _jsx(CopyButton, { text: JSON.stringify(a.arguments, null, 2) })] }), _jsx("pre", { style: {
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
                                                }, children: JSON.stringify(a.arguments, null, 2) })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }, children: "Response Output" }), _jsx(CopyButton, { text: typeof a.result === "string" ? a.result : JSON.stringify(a.result, null, 2) })] }), _jsx("pre", { style: {
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
                                                }, children: typeof a.result === "string" ? a.result : JSON.stringify(a.result, null, 2) })] })] }))] }, a.id));
                })) })] }));
};
//# sourceMappingURL=Actions.js.map