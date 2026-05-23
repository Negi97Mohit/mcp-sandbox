import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState, useRef } from "react";
import { Send, Trash2, Plus, Bot, User, CheckCircle2, Loader2, ChevronDown, ChevronUp, Copy } from "lucide-react";
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
            padding: "3px 6px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            fontWeight: 500,
            transition: "all 0.2s"
        }, title: "Copy to clipboard", children: [copied ? _jsx(CheckCircle2, { size: 11, color: "var(--success)" }) : _jsx(Copy, { size: 11 }), _jsx("span", { children: copied ? "Copied!" : "Copy" })] }));
};
export const Chat = () => {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState("default");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [toolCallsRun, setToolCallsRun] = useState([]);
    const [activeToolLog, setActiveToolLog] = useState("");
    const messagesEndRef = useRef(null);
    const loadSessions = async () => {
        try {
            const data = await api.listSessions ? await api.listSessions() : [{ id: "default", lastMessage: "Start a conversation" }];
            // If listSessions is not available, default to a standard array
            const formatted = Array.isArray(data) ? data : [];
            if (formatted.length === 0) {
                formatted.push({ id: "default", lastMessage: "Start a conversation" });
            }
            setSessions(formatted);
        }
        catch (e) {
            console.error(e);
            setSessions([{ id: "default", lastMessage: "Start a conversation" }]);
        }
    };
    const loadHistory = async (sessionId) => {
        try {
            const history = await api.getChatHistory(sessionId);
            setMessages(history || []);
        }
        catch (e) {
            console.error(e);
        }
    };
    useEffect(() => {
        loadSessions();
        loadHistory(activeSession);
    }, [activeSession]);
    useEffect(() => {
        // Setup IPC listeners for real-time stream updates
        const handleStreamUpdate = (data) => {
            if (data.sessionId !== activeSession)
                return;
            if (data.type === "status") {
                if (data.status === "thinking") {
                    setStatusMsg("Thinking...");
                }
                else {
                    setStatusMsg(null);
                }
            }
            else if (data.type === "tool_start") {
                setStatusMsg(`Running tool: ${data.toolName}...`);
                setToolCallsRun(prev => [...prev, {
                        id: data.toolName,
                        name: data.toolName,
                        args: data.arguments,
                        status: "running",
                        logs: []
                    }]);
                setActiveToolLog("");
            }
            else if (data.type === "tool_log") {
                setActiveToolLog(prev => prev + "\n" + data.text);
                setToolCallsRun(prev => prev.map(t => {
                    if (t.status === "running") {
                        return { ...t, logs: [...t.logs, data.text] };
                    }
                    return t;
                }));
            }
            else if (data.type === "tool_end") {
                setStatusMsg(`Finished tool: ${data.toolName}`);
                setToolCallsRun(prev => prev.map(t => {
                    if (t.name === data.toolName && t.status === "running") {
                        return { ...t, status: "complete", result: data.result };
                    }
                    return t;
                }));
            }
            else if (data.type === "complete") {
                setStatusMsg(null);
                setSending(false);
                loadHistory(activeSession);
                loadSessions();
            }
            else if (data.type === "error") {
                setStatusMsg(null);
                setSending(false);
                alert(`Agent encounter error: ${data.error}`);
                loadHistory(activeSession);
            }
        };
        api.onChatStream(handleStreamUpdate);
        return () => {
            api.offChatStream();
        };
    }, [activeSession]);
    useEffect(() => {
        // Auto-scroll to bottom of messages
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, statusMsg, activeToolLog]);
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending)
            return;
        const userMessage = input.trim();
        setInput("");
        setSending(true);
        setToolCallsRun([]);
        setActiveToolLog("");
        // Optimistically update list
        setMessages(prev => [...prev, {
                id: `opt_${Date.now()}`,
                role: "user",
                content: userMessage,
                timestamp: new Date().toISOString()
            }]);
        try {
            await api.sendChatMessage(activeSession, userMessage);
        }
        catch (err) {
            console.error(err);
            setSending(false);
            setStatusMsg(null);
            alert(`Failed to send message: ${err.message || err}`);
        }
    };
    const handleClear = async () => {
        if (!confirm("Are you sure you want to clear chat history for this session?"))
            return;
        try {
            await api.clearChatHistory(activeSession);
            loadHistory(activeSession);
            loadSessions();
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleNewSession = () => {
        const name = prompt("Enter a unique name for this chat session:");
        if (!name || !name.trim())
            return;
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        setActiveSession(cleanName);
    };
    return (_jsxs("div", { className: "animate-fade-in", style: { display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px", height: "calc(100vh - 88px)" }, children: [_jsxs("div", { className: "glass", style: { display: "flex", flexDirection: "column", height: "100%", padding: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsx("h2", { style: { fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-display)" }, children: "Conversations" }), _jsxs("button", { onClick: handleNewSession, style: {
                                    background: "rgba(99,102,241,0.1)",
                                    border: "1px solid var(--border)",
                                    color: "var(--primary)",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "11px",
                                    fontWeight: 600
                                }, children: [_jsx(Plus, { size: 12 }), " New"] })] }), _jsx("div", { style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }, children: sessions.map(s => {
                            const isActive = s.id === activeSession;
                            return (_jsxs("div", { onClick: () => setActiveSession(s.id), style: {
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                    border: "1px solid",
                                    borderColor: isActive ? "var(--border)" : "transparent",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    transition: "all 0.2s"
                                }, children: [_jsx("div", { style: { fontWeight: 600, fontSize: "13px", color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }, children: s.id }), _jsx("div", { style: { fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: s.lastMessage || "No messages yet" })] }, s.id));
                        }) })] }), _jsxs("div", { className: "glass", style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.15)" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx(Bot, { size: 20, color: "var(--primary)" }), _jsxs("div", { children: [_jsx("h2", { style: { fontSize: "14px", fontWeight: 600 }, children: "Local DevOps Agent" }), _jsx("span", { style: { fontSize: "10px", color: "var(--success)", fontWeight: 500 }, children: "\u25CF SECURE ADMIN SHELL ACTIVE" })] })] }), _jsx("button", { onClick: handleClear, style: {
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    padding: "6px"
                                }, title: "Clear Chat History", children: _jsx(Trash2, { size: 16 }) })] }), _jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }, children: [messages.filter(m => m.role !== "system").map(m => {
                                const isAI = m.role === "assistant";
                                const isTool = m.role === "tool";
                                if (isTool) {
                                    return (_jsx(ToolCallItem, { toolName: m.tool_call_id || "tool", result: m.content }, m.id));
                                }
                                return (_jsxs("div", { style: {
                                        display: "flex",
                                        gap: "12px",
                                        maxWidth: "80%",
                                        alignSelf: isAI ? "flex-start" : "flex-end",
                                        flexDirection: isAI ? "row" : "row-reverse"
                                    }, children: [_jsx("div", { style: {
                                                background: isAI ? "rgba(99,102,241,0.15)" : "rgba(168,85,247,0.15)",
                                                padding: "8px",
                                                borderRadius: "50%",
                                                color: isAI ? "var(--primary)" : "var(--secondary)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "36px",
                                                height: "36px"
                                            }, children: isAI ? _jsx(Bot, { size: 18 }) : _jsx(User, { size: 18 }) }), _jsxs("div", { style: {
                                                background: isAI ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
                                                border: "1px solid",
                                                borderColor: isAI ? "var(--border)" : "rgba(99,102,241,0.25)",
                                                padding: "12px 16px",
                                                borderRadius: isAI ? "0px 12px 12px 12px" : "12px 0px 12px 12px",
                                                fontSize: "13.5px",
                                                lineHeight: "1.5",
                                                whiteSpace: "pre-wrap",
                                                color: "var(--text-primary)"
                                            }, children: [m.content, _jsx("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "8px" }, children: _jsx(CopyButton, { text: m.content }) }), m.tool_calls && m.tool_calls.map((tc, i) => (_jsxs("div", { style: { marginTop: "12px", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px" }, children: [_jsxs("span", { style: { color: "var(--primary)", fontWeight: 600 }, children: ["calling ", tc.function.name, "..."] }), _jsxs("div", { style: { color: "var(--text-secondary)", marginTop: "4px" }, children: ["args: ", tc.function.arguments] })] }, i)))] })] }, m.id));
                            }), toolCallsRun.map((tc, idx) => (_jsx("div", { style: { alignSelf: "flex-start", maxWidth: "80%", width: "100%" }, children: _jsxs("div", { style: { display: "flex", gap: "12px" }, children: [_jsx("div", { style: { background: "rgba(99,102,241,0.15)", padding: "8px", borderRadius: "50%", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }, children: _jsx(Bot, { size: 18 }) }), _jsxs("div", { className: "glass", style: { padding: "14px 18px", borderRadius: "0 12px 12px 12px", width: "100%", borderLeft: "4px solid var(--primary)" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13px" }, children: [_jsx(Loader2, { size: 14, className: "spin", style: { animation: "spin 1s linear infinite" } }), "Running DevOps tool: ", _jsx("span", { style: { fontFamily: "monospace", color: "var(--primary)", padding: "1px 6px", background: "rgba(99,102,241,0.1)", borderRadius: "4px" }, children: tc.name })] }), activeToolLog && (_jsx("div", { style: { marginTop: "10px", background: "#020208", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px", color: "var(--success)", whiteSpace: "pre-wrap", overflowX: "auto" }, children: activeToolLog }))] })] }) }, idx))), statusMsg && !toolCallsRun.some(x => x.status === "running") && (_jsxs("div", { style: { display: "flex", gap: "12px", alignSelf: "flex-start" }, children: [_jsx("div", { style: { background: "rgba(99,102,241,0.15)", padding: "8px", borderRadius: "50%", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }, children: _jsx(Loader2, { size: 18, className: "spin", style: { animation: "spin 1.5s linear infinite" } }) }), _jsx("div", { style: { padding: "12px 16px", color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic" }, children: statusMsg })] })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { onSubmit: handleSend, style: { display: "flex", gap: "10px", padding: "16px 20px", borderTop: "1px solid var(--border)", background: "rgba(10,10,25,0.4)" }, children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), disabled: sending, placeholder: sending ? "Agent is processing sandbox request..." : "Ask the DevOps Agent to build, analyze, check netlify...", style: {
                                    flex: 1,
                                    padding: "12px 16px",
                                    background: "rgba(0, 0, 0, 0.3)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "13.5px",
                                    outline: "none",
                                    transition: "border-color 0.2s"
                                }, onFocus: (e) => e.target.style.borderColor = "var(--primary)", onBlur: (e) => e.target.style.borderColor = "var(--border)" }), _jsx("button", { type: "submit", disabled: !input.trim() || sending, className: "glow-btn", style: {
                                    padding: "0 18px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }, children: _jsx(Send, { size: 16 }) })] })] })] }));
};
// Tool execution card
const ToolCallItem = ({ toolName, result }) => {
    const [expanded, setExpanded] = useState(false);
    let formattedResult = "";
    try {
        const parsed = JSON.parse(result);
        formattedResult = JSON.stringify(parsed, null, 2);
    }
    catch (e) {
        formattedResult = result;
    }
    return (_jsx("div", { style: { alignSelf: "flex-start", width: "100%", maxWidth: "80%", margin: "4px 0" }, children: _jsxs("div", { style: { display: "flex", gap: "12px" }, children: [_jsx("div", { style: { width: "36px" } }), " ", _jsxs("div", { className: "glass", style: {
                        borderRadius: "8px",
                        width: "100%",
                        borderLeft: "4px solid var(--success)",
                        background: "rgba(16, 185, 129, 0.02)"
                    }, children: [_jsxs("div", { onClick: () => setExpanded(!expanded), style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 14px",
                                cursor: "pointer"
                            }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }, children: [_jsx(CheckCircle2, { size: 14, color: "var(--success)" }), _jsx("span", { children: "Tool Call Completed:" }), _jsx("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--success)" }, children: toolName.replace(/msg_\d+_t/, "exec") })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx("span", { onClick: (e) => e.stopPropagation(), children: _jsx(CopyButton, { text: formattedResult }) }), expanded ? _jsx(ChevronUp, { size: 14 }) : _jsx(ChevronDown, { size: 14 })] })] }), expanded && (_jsx("div", { style: {
                                padding: "12px",
                                borderTop: "1px solid var(--border)",
                                background: "#020208",
                                fontFamily: "monospace",
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                maxHeight: "300px",
                                overflowY: "auto",
                                whiteSpace: "pre-wrap"
                            }, children: formattedResult }))] })] }) }));
};
//# sourceMappingURL=Chat.js.map