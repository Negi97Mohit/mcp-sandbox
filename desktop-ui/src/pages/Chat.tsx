import React, { useEffect, useState, useRef } from "react";
import { 
  Send, 
  Trash2, 
  Plus, 
  Bot, 
  User, 
  CheckCircle2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertTriangle
} from "lucide-react";
import { api } from "../api/bridge.js";

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
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
      }}
      title="Copy to clipboard"
    >
      {copied ? <CheckCircle2 size={11} color="var(--success)" /> : <Copy size={11} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

interface Message {
  id: string;
  role: "system" | "user" | "assistant" | "tool" | "error";
  content: string;
  timestamp: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export const Chat: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string>("default");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [toolCallsRun, setToolCallsRun] = useState<any[]>([]);
  const [activeToolLog, setActiveToolLog] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async (currentActive = activeSession) => {
    try {
      const data = await api.listSessions ? await api.listSessions() : [{ id: "default", lastMessage: "Start a conversation" }];
      // If listSessions is not available, default to a standard array
      let formatted = Array.isArray(data) ? data : [];
      
      // Ensure the current active session is present in the list, even if it is empty/new
      if (currentActive && !formatted.some(s => s.id === currentActive)) {
        formatted = [{
          id: currentActive,
          lastMessage: "Start a conversation",
          messageCount: 0
        }, ...formatted];
      }
      
      if (formatted.length === 0) {
        formatted.push({ id: "default", lastMessage: "Start a conversation" });
      }
      setSessions(formatted);
    } catch (e) {
      console.error(e);
      const fallback = [{ id: "default", lastMessage: "Start a conversation" }];
      if (currentActive && currentActive !== "default") {
        fallback.unshift({ id: currentActive, lastMessage: "Start a conversation" });
      }
      setSessions(fallback);
    }
  };

  const loadHistory = async (sessionId: string) => {
    try {
      const history = await api.getChatHistory(sessionId);
      const historyList = history || [];
      setMessages(historyList);
      return historyList;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  useEffect(() => {
    loadSessions(activeSession);
    loadHistory(activeSession);
  }, [activeSession]);

  useEffect(() => {
    // Setup IPC listeners for real-time stream updates
    const handleStreamUpdate = (data: any) => {
      if (data.sessionId !== activeSession) return;

      if (data.type === "status") {
        if (data.status === "thinking") {
          setStatusMsg("Thinking...");
        } else {
          setStatusMsg(null);
        }
      } else if (data.type === "tool_start") {
        setStatusMsg(`Running tool: ${data.toolName}...`);
        setToolCallsRun(prev => [...prev, {
          id: data.toolName,
          name: data.toolName,
          args: data.arguments,
          status: "running",
          logs: []
        }]);
        setActiveToolLog("");
      } else if (data.type === "tool_log") {
        setActiveToolLog(prev => prev + "\n" + data.text);
        setToolCallsRun(prev => prev.map(t => {
          if (t.status === "running") {
            return { ...t, logs: [...t.logs, data.text] };
          }
          return t;
        }));
      } else if (data.type === "tool_end") {
        setStatusMsg(`Finished tool: ${data.toolName}`);
        setToolCallsRun(prev => prev.map(t => {
          if (t.name === data.toolName && t.status === "running") {
            return { ...t, status: "complete", result: data.result };
          }
          return t;
        }));
      } else if (data.type === "complete") {
        setStatusMsg(null);
        setSending(false);
        loadHistory(activeSession);
        loadSessions(activeSession);
      } else if (data.type === "error") {
        setStatusMsg(null);
        setSending(false);
        loadHistory(activeSession).then(history => {
          setMessages([...history, {
            id: `err_${Date.now()}`,
            role: "error",
            content: data.error,
            timestamp: new Date().toISOString()
          }]);
        });
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

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
    } catch (err: any) {
      console.error(err);
      setSending(false);
      setStatusMsg(null);
      loadHistory(activeSession).then(history => {
        setMessages([...history, {
          id: `err_${Date.now()}`,
          role: "error",
          content: err.message || String(err),
          timestamp: new Date().toISOString()
        }]);
      });
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear chat history for this session?")) return;
    try {
      await api.clearChatHistory(activeSession);
      loadHistory(activeSession);
      loadSessions(activeSession);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewSession = () => {
    const name = prompt("Enter a unique name for this chat session:");
    if (!name || !name.trim()) return;
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    setActiveSession(cleanName);
  };

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px", height: "calc(100vh - 88px)" }}>
      
      {/* Left side: Sessions panels */}
      <div className="glass" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-display)" }}>Conversations</h2>
          <button 
            onClick={handleNewSession}
            style={{
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
            }}
          >
            <Plus size={12} /> New
          </button>
        </div>

        {/* Sessions list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {sessions.map(s => {
            const isActive = s.id === activeSession;
            return (
              <div 
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                style={{
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
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "13px", color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {s.id}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.lastMessage || "No messages yet"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side: Chat Console */}
      <div className="glass" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        
        {/* Chat Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Bot size={20} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 600 }}>Local DevOps Agent</h2>
              <span style={{ fontSize: "10px", color: "var(--success)", fontWeight: 500 }}>
                ● SECURE ADMIN SHELL ACTIVE
              </span>
            </div>
          </div>
          <button 
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px"
            }}
            title="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.filter(m => m.role !== "system").map(m => {
            const isAI = m.role === "assistant";
            const isTool = m.role === "tool";
            const isError = m.role === "error";
            
            if (isTool) {
              return (
                <ToolCallItem 
                  key={m.id} 
                  toolName={m.tool_call_id || "tool"} 
                  result={m.content} 
                />
              );
            }

            if (isError) {
              return (
                <div 
                  key={m.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    maxWidth: "80%",
                    alignSelf: "center",
                    width: "100%",
                    margin: "8px 0"
                  }}
                >
                  <div style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: "#ef4444",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", color: "#f87171" }}>
                      <AlertTriangle size={15} /> Error Encountered
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={m.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  maxWidth: "80%",
                  alignSelf: isAI ? "flex-start" : "flex-end",
                  flexDirection: isAI ? "row" : "row-reverse"
                }}
              >
                {/* Avatar */}
                <div style={{
                  background: isAI ? "rgba(99,102,241,0.15)" : "rgba(168,85,247,0.15)",
                  padding: "8px",
                  borderRadius: "50%",
                  color: isAI ? "var(--primary)" : "var(--secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px"
                }}>
                  {isAI ? <Bot size={18} /> : <User size={18} />}
                </div>

                {/* Message Box */}
                <div style={{
                  background: isAI ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
                  border: "1px solid",
                  borderColor: isAI ? "var(--border)" : "rgba(99,102,241,0.25)",
                  padding: "12px 16px",
                  borderRadius: isAI ? "0px 12px 12px 12px" : "12px 0px 12px 12px",
                  fontSize: "13.5px",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  color: "var(--text-primary)"
                }}>
                  {m.content || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(No response content)</span>}

                  {/* Copy button for message */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <CopyButton text={m.content} />
                  </div>

                  {/* If assistant returned tool_calls */}
                  {m.tool_calls && m.tool_calls.map((tc: any, i: number) => (
                    <div key={i} style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px" }}>
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>calling {tc.function.name}...</span>
                      <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>args: {tc.function.arguments}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Running/Thinking items */}
          {toolCallsRun.map((tc, idx) => (
            <div key={idx} style={{ alignSelf: "flex-start", maxWidth: "80%", width: "100%" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ background: "rgba(99,102,241,0.15)", padding: "8px", borderRadius: "50%", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }}>
                  <Bot size={18} />
                </div>
                <div className="glass" style={{ padding: "14px 18px", borderRadius: "0 12px 12px 12px", width: "100%", borderLeft: "4px solid var(--primary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13px" }}>
                    <Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    Running DevOps tool: <span style={{ fontFamily: "monospace", color: "var(--primary)", padding: "1px 6px", background: "rgba(99,102,241,0.1)", borderRadius: "4px" }}>{tc.name}</span>
                  </div>
                  {activeToolLog && (
                    <div style={{ marginTop: "10px", background: "#020208", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px", color: "var(--success)", whiteSpace: "pre-wrap", overflowX: "auto" }}>
                      {activeToolLog}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {statusMsg && !toolCallsRun.some(x => x.status === "running") && (
            <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
              <div style={{ background: "rgba(99,102,241,0.15)", padding: "8px", borderRadius: "50%", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }}>
                <Loader2 size={18} className="spin" style={{ animation: "spin 1.5s linear infinite" }} />
              </div>
              <div style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic" }}>
                {statusMsg}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", padding: "16px 20px", borderTop: "1px solid var(--border)", background: "rgba(10,10,25,0.4)" }}>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder={sending ? "Agent is processing sandbox request..." : "Ask the DevOps Agent to build, analyze, check netlify..."}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "white",
              fontSize: "13.5px",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <button 
            type="submit"
            disabled={!input.trim() || sending}
            className="glow-btn"
            style={{
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

// Tool execution card
const ToolCallItem: React.FC<{ toolName: string; result: string }> = ({ toolName, result }) => {
  const [expanded, setExpanded] = useState(false);
  
  let formattedResult = "";
  try {
    const parsed = JSON.parse(result);
    formattedResult = JSON.stringify(parsed, null, 2);
  } catch (e) {
    formattedResult = result;
  }

  return (
    <div style={{ alignSelf: "flex-start", width: "100%", maxWidth: "80%", margin: "4px 0" }}>
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ width: "36px" }} /> {/* Avatar spacing alignment */}
        <div 
          className="glass" 
          style={{ 
            borderRadius: "8px", 
            width: "100%", 
            borderLeft: "4px solid var(--success)",
            background: "rgba(16, 185, 129, 0.02)"
          }}
        >
          <div 
            onClick={() => setExpanded(!expanded)}
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "10px 14px",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span>Tool Call Completed:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--success)" }}>
                {toolName.replace(/msg_\d+_t/, "exec")}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span onClick={(e) => e.stopPropagation()}>
                <CopyButton text={formattedResult} />
              </span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {expanded && (
            <div style={{ 
              padding: "12px", 
              borderTop: "1px solid var(--border)", 
              background: "#020208", 
              fontFamily: "monospace", 
              fontSize: "11px", 
              color: "var(--text-secondary)", 
              maxHeight: "300px", 
              overflowY: "auto", 
              whiteSpace: "pre-wrap"
            }}>
              {formattedResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
