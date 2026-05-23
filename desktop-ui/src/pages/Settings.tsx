import React, { useEffect, useState, useRef } from "react";
import { Save, Key, AppWindow, CheckCircle, AlertTriangle, ShieldCheck, Palette, Eye, EyeOff, Copy, Check, X, Search, ChevronDown } from "lucide-react";
import { api } from "../api/bridge.js";

// ─── Clipboard helper with Electron fallback ────────────────────────────────
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for Electron renderer (clipboard API may not be available)
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
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy value"}
      style={{
        background: copied ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.08)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.15)"}`,
        color: copied ? "var(--success)" : "var(--text-muted)",
        borderRadius: "6px",
        padding: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
      onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.color = "var(--text-muted)"; }}}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

// ─── Credential Field ────────────────────────────────────────────────────────
const CredentialField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
          <input 
            type={visible ? "text" : "password"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "10px 40px 10px 12px",
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "monospace",
              boxSizing: "border-box"
            }}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            style={{
              position: "absolute",
              right: "10px",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <CopyButton text={value || ""} />
      </div>
    </div>
  );
};

// ─── Searchable Model Dropdown ───────────────────────────────────────────────
const ModelSelector: React.FC<{
  models: any[];
  value: string;
  onChange: (modelId: string) => void;
}> = ({ models, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = models.filter((m: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.id?.toLowerCase().includes(q)) ||
           (m.name?.toLowerCase().includes(q)) ||
           (m.displayName?.toLowerCase().includes(q));
  });



  const currentModel = models.find((m: any) => m.id === value);
  const displayText = currentModel?.name || currentModel?.displayName || value || "Select a model...";

  if (editMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Type any OpenRouter model ID (e.g. anthropic/claude-4-sonnet)"
            autoFocus
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "monospace",
              boxSizing: "border-box"
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (customValue.trim()) {
                  onChange(customValue.trim());
                }
                setEditMode(false);
              }
              if (e.key === "Escape") setEditMode(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (customValue.trim()) onChange(customValue.trim());
              setEditMode(false);
            }}
            style={{
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "var(--success)",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--error)",
              borderRadius: "6px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "rgba(0, 0, 0, 0.25)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text-primary)",
          fontSize: "13px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "rgba(10, 10, 25, 0.98)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          zIndex: 100,
          maxHeight: "360px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>
          {/* Search bar */}
          <div style={{ padding: "8px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Search size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                autoFocus
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Model list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* Custom model option */}
            <div
              onClick={() => { setEditMode(true); setCustomValue(value); setOpen(false); }}
              style={{
                padding: "8px 14px",
                fontSize: "12px",
                cursor: "pointer",
                color: "var(--primary)",
                fontWeight: 600,
                borderBottom: "1px solid rgba(99,102,241,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              ✏️ Enter Custom Model ID...
            </div>

            {filtered.length > 0 && (
              <div style={{ padding: "6px 14px 3px", fontSize: "10px", fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Free Text Models ({filtered.length})
              </div>
            )}
            {filtered.map((m: any) => (
              <ModelOption key={m.id} model={m} isSelected={m.id === value} onSelect={() => { onChange(m.id); setOpen(false); setSearch(""); }} />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                No models match "{search}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)", fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>
            {models.length} free text models from OpenRouter
          </div>
        </div>
      )}
    </div>
  );
};

const ModelOption: React.FC<{ model: any; isSelected: boolean; onSelect: () => void }> = ({ model, isSelected, onSelect }) => (
  <div
    onClick={onSelect}
    style={{
      padding: "7px 14px",
      fontSize: "12px",
      cursor: "pointer",
      background: isSelected ? "rgba(99,102,241,0.12)" : "transparent",
      borderLeft: isSelected ? "2px solid var(--primary)" : "2px solid transparent",
      display: "flex",
      flexDirection: "column",
      gap: "1px",
    }}
    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}>
      {model.name || model.id}
    </span>
    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
      {model.id}
    </span>
  </div>
);

export const Settings: React.FC = () => {
  const [env, setEnv] = useState<any>({});
  const [models, setModels] = useState<any[]>([]);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("mcp-theme") || "glass");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  const loadData = async () => {
    try {
      setModelsLoading(true);
      const e = await api.getConfig();
      const m = await api.getAvailableModels();
      const al = await api.getAutoLaunch();
      setEnv(e);
      setModels(m);
      setAutoLaunch(al);
    } catch (err) {
      console.error(err);
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.updateConfig(env);
      await api.setAutoLaunch(autoLaunch);
      setMsg({ text: "Configurations saved and loaded successfully!", type: "success" });
      loadData();
    } catch (err: any) {
      console.error(err);
      setMsg({ text: `Failed to save configurations: ${err.message || err}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "28px", letterSpacing: "-0.5px" }}>
          Platform Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Manage global environment configurations, model parameters, and desktop auto-startup rules.
        </p>
      </div>

      {/* Live feedback */}
      {msg && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          background: msg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: msg.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
          color: msg.type === "success" ? "var(--success)" : "var(--error)",
        }}>
          {msg.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Form container */}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Environment Credentials Section */}
        <div className="glass" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Key size={18} color="var(--primary)" /> API Credentials
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <CredentialField
              label="OPENROUTER API KEY"
              value={env.OPENROUTER_API_KEY || ""}
              onChange={(val) => setEnv({ ...env, OPENROUTER_API_KEY: val })}
              placeholder="Enter OpenRouter API Key..."
            />
            <CredentialField
              label="DISCORD BOT TOKEN"
              value={env.DISCORD_TOKEN || ""}
              onChange={(val) => setEnv({ ...env, DISCORD_TOKEN: val })}
              placeholder="Enter Discord Bot Token..."
            />
            <CredentialField
              label="NETLIFY PERSONAL TOKEN"
              value={env.NETLIFY_TOKEN || ""}
              onChange={(val) => setEnv({ ...env, NETLIFY_TOKEN: val })}
              placeholder="Enter Netlify API Token..."
            />

            {/* Editable text field for ALLOWED_USER_ID */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>
                ALLOWED USER ID (Discord)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input 
                  type="text"
                  value={env.ALLOWED_USER_ID || ""}
                  onChange={(e) => setEnv({ ...env, ALLOWED_USER_ID: e.target.value })}
                  placeholder="Discord User ID (e.g. 1210691284323405856)"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    boxSizing: "border-box"
                  }}
                />
                <CopyButton text={env.ALLOWED_USER_ID || ""} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Model Parameters Section */}
        <div className="glass" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <ShieldCheck size={18} color="var(--secondary)" /> AI Model
            </h2>
            {modelsLoading && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Loading models...</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Active Thinking Model
            </label>
            
            {/* Searchable Model Selector */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <ModelSelector
                models={models}
                value={env.MODEL_NAME || ""}
                onChange={(modelId) => setEnv({ ...env, MODEL_NAME: modelId })}
              />
              <CopyButton text={env.MODEL_NAME || ""} />
            </div>

            {/* Current model indicator */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "8px 12px", 
              background: "rgba(99,102,241,0.06)", 
              borderRadius: "6px", 
              border: "1px solid rgba(99,102,241,0.1)" 
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Current:</span>
              <code style={{ 
                fontSize: "12px", 
                color: "var(--primary)", 
                fontFamily: "monospace", 
                fontWeight: 600,
                wordBreak: "break-all"
              }}>
                {env.MODEL_NAME || "Not set"}
              </code>
            </div>
          </div>
        </div>

        {/* Desktop Preferences */}
        <div className="glass" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AppWindow size={18} color="var(--accent)" /> Desktop Preferences
          </h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 600 }}>Auto-launch on startup</div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Automatically launch the Sandbox Control Panel when the computer boots up.
              </div>
            </div>
            
            {/* Custom slider toggle switch */}
            <div 
              onClick={() => setAutoLaunch(!autoLaunch)}
              style={{
                width: "48px",
                height: "26px",
                background: autoLaunch ? "var(--primary)" : "rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "3px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: autoLaunch ? "flex-end" : "flex-start",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: "20px",
                height: "20px",
                background: "white",
                borderRadius: "50%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }} />
            </div>
          </div>
        </div>

        {/* Visual Styling & Themes */}
        <div className="glass" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Palette size={18} color="var(--primary)" /> Visual Styling & Themes
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {[
              { id: "glass", name: "Default Glass", desc: "Semi-transparent dark glassmorphism", icon: "✨" },
              { id: "brutalist", name: "Neo-Brutalist", desc: "High contrast yellow & solid outlines", icon: "🎨" },
              { id: "light", name: "Chic Light", desc: "Soft slate and clean light panels", icon: "☀️" },
              { id: "chic", name: "Retro Chic", desc: "Warm vintage cream and sage tones", icon: "☕" },
              { id: "minimal", name: "Ultra-Minimal", desc: "Solid monochrome pure minimalism", icon: "🔳" },
              { id: "modern", name: "Futuristic Modern", desc: "Neon cyan/indigo cybernetic glow", icon: "🌌" },
              { id: "dracula", name: "Dracula Gothic", desc: "Vibrant vampire purples and neon green", icon: "🧛" },
              { id: "cyberpunk", name: "Cyberpunk Hacker", desc: "Saturated yellow, black and neon pink/cyan", icon: "⚡" },
              { id: "nordic", name: "Nordic Frost", desc: "Cool polar slates and icy frost blue accents", icon: "❄️" },
              { id: "brutalist-mono", name: "Stark Mono", desc: "Pure brutalist monochrome courier layout", icon: "📟" },
              { id: "solarized-dark", name: "Solarized Dark", desc: "Retro amber and teal terminal console look", icon: "📟" },
              { id: "glass-emerald", name: "Glass Emerald", desc: "Frosted dark-moss and luminous mint borders", icon: "🌿" },
              { id: "synthwave", name: "Synthwave Retro", desc: "Vibrant 80s pink-purple sunset glow design", icon: "🎸" },
              { id: "minimal-warm", name: "Minimal Warm", desc: "Cozy beige/linen texture and elegant serif text", icon: "🌾" },
              { id: "vogue", name: "Vogue Editorial", desc: "High-contrast serif haute couture aesthetic", icon: "🖤" },
              { id: "abyss", name: "Deep Abyss", desc: "Absolute black-ocean base and bio-cyan accents", icon: "🐙" },
            ].map(t => {
              const isSel = theme === t.id;
              return (
                <div 
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    localStorage.setItem("mcp-theme", t.id);
                    document.documentElement.setAttribute("data-theme", t.id);
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: isSel ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: isSel ? "rgba(99, 102, 241, 0.08)" : "rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13.5px" }}>
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    {t.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button 
            type="submit"
            disabled={saving}
            className="glow-btn"
            style={{
              padding: "12px 28px",
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Save size={14} />
            {saving ? "Saving settings..." : "Save Settings"}
          </button>
        </div>

      </form>
    </div>
  );
};
