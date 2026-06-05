import React, { useEffect, useState } from "react";
import { GitCommit, Play, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { api } from "../api/bridge.js";

// Define the GraphNode locally to match what we expect from the bridge
interface GraphNode {
    id: string;
    parentId: string | null;
    timestamp: string;
    type: string;
    label: string;
    status: string;
    createdBy: string;
    colorCode: string;
    details: any;
}

interface GraphData {
    nodes: GraphNode[];
    activeNodeId: string | null;
}

export const Visualizer: React.FC = () => {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], activeNodeId: null });
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Initial fetch
        const fetchGraph = async () => {
            try {
                if (api.getGraph) {
                    const data = await api.getGraph();
                    setGraphData(data);
                }
                if (api.listGraphs) {
                    const sessionList = await api.listGraphs();
                    setSessions(sessionList);
                    if (sessionList.length > 0) {
                        setCurrentSessionId(sessionList[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to load graph data:", error);
            }
        };
        fetchGraph();

        // Subscribe to updates
        if (api.onGraphUpdate) {
            api.onGraphUpdate((data: GraphData) => {
                setGraphData(data);
                // Update selected node if it changed
                setSelectedNode(prev => {
                    if (prev) {
                        return data.nodes.find(n => n.id === prev.id) || prev;
                    }
                    return null;
                });
            });
            return () => {
                if (api.offGraphUpdate) api.offGraphUpdate();
            };
        }
    }, []);

    const handleRevert = async (nodeId: string) => {
        if (!api.revertGraph) return;
        if (window.confirm("Are you sure you want to revert the workspace to this state? Unsaved changes will be lost.")) {
            try {
                const res = await api.revertGraph(nodeId);
                if (!res.success) {
                    alert("Revert failed: " + res.error);
                }
            } catch (err: any) {
                alert("Revert error: " + err.message);
            }
        }
    };

    const handleLoadSession = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sid = e.target.value;
        setCurrentSessionId(sid);
        if (api.loadGraph) {
            await api.loadGraph(sid);
            if (api.getGraph) {
                const data = await api.getGraph();
                setGraphData(data);
                setSelectedNode(null);
            }
        }
    };

    // Helper to get color values based on colorCode
    const getColor = (code: string) => {
        const colors: Record<string, string> = {
            emerald: "#10b981",
            indigo: "#6366f1",
            amber: "#f59e0b",
            rose: "#f43f5e",
            slate: "#64748b"
        };
        return colors[code] || colors.slate;
    };

    const getIcon = (status: string) => {
        if (status === "failed" || status === "aborted") return <XCircle size={20} />;
        if (status === "escalated") return <AlertTriangle size={20} />;
        if (status === "success") return <CheckCircle2 size={20} />;
        if (status === "running") return <Play size={20} />;
        return <GitCommit size={20} />;
    };

    return (
        <div style={{ display: "flex", height: "100%", gap: "20px" }}>
            {/* Graph Visualizer Area */}
            <div style={{
                flex: 1,
                background: "var(--bg-surface)",
                borderRadius: "12px",
                padding: "24px",
                overflowY: "auto",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "18px" }}>Live Execution Graph</h2>
                    {sessions.length > 0 && (
                        <select 
                            value={currentSessionId || ""} 
                            onChange={handleLoadSession}
                            style={{ 
                                background: "var(--bg-deep)", 
                                color: "var(--text-primary)", 
                                border: "1px solid var(--border)",
                                padding: "8px",
                                borderRadius: "6px"
                            }}
                        >
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {new Date(s.timestamp).toLocaleString()} ({s.nodeCount} nodes)
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div style={{ position: "relative", marginLeft: "20px" }}>
                    {graphData.nodes.map((node, index) => {
                        const isLast = index === graphData.nodes.length - 1;
                        const isActive = node.id === graphData.activeNodeId;
                        const isSelected = selectedNode?.id === node.id;
                        const color = getColor(node.colorCode);

                        return (
                            <div key={node.id} style={{ display: "flex", position: "relative", marginBottom: "30px", cursor: "pointer" }} onClick={() => setSelectedNode(node)}>
                                {/* Connecting line */}
                                {!isLast && (
                                    <div style={{
                                        position: "absolute",
                                        left: "14px",
                                        top: "30px",
                                        bottom: "-30px",
                                        width: "2px",
                                        background: "var(--border)",
                                        zIndex: 0
                                    }} />
                                )}
                                
                                {/* Node Icon */}
                                <div style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    background: `var(--bg-surface)`,
                                    border: `2px solid ${color}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: color,
                                    zIndex: 1,
                                    flexShrink: 0,
                                    boxShadow: isActive ? `0 0 10px ${color}80` : "none"
                                }}>
                                    {getIcon(node.status)}
                                </div>

                                {/* Node Content */}
                                <div style={{
                                    marginLeft: "20px",
                                    background: isSelected ? "rgba(255,255,255,0.05)" : "transparent",
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: isSelected ? `1px solid ${color}40` : "1px solid transparent",
                                    transition: "all 0.2s",
                                    flex: 1
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{node.label}</span>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(node.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                                        {node.details.description || "No description"}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
                                        <span style={{ padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
                                            By: {node.createdBy}
                                        </span>
                                        <span style={{ padding: "2px 6px", borderRadius: "4px", background: `${color}20`, color: color }}>
                                            {node.status.toUpperCase()}
                                        </span>
                                        {node.details.revertible && (
                                            <span style={{ padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <GitCommit size={10} /> Checkpoint
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Details Panel */}
            <div style={{
                width: "350px",
                background: "var(--bg-surface)",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto"
            }}>
                <h3 style={{ margin: "0 0 20px 0", color: "var(--text-primary)", fontSize: "16px" }}>Node Details</h3>
                {selectedNode ? (
                    <div>
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Type</div>
                            <div style={{ color: "var(--text-primary)", fontSize: "14px" }}>{selectedNode.type}</div>
                        </div>
                        
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Status</div>
                            <div style={{ color: getColor(selectedNode.colorCode), fontSize: "14px", fontWeight: 600 }}>{selectedNode.status.toUpperCase()}</div>
                        </div>

                        {selectedNode.details.gitCommitHash && (
                            <div style={{ marginBottom: "16px" }}>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Git Checkpoint</div>
                                <div style={{ color: "var(--text-secondary)", fontSize: "13px", fontFamily: "monospace" }}>
                                    {selectedNode.details.gitCommitHash.substring(0, 7)}
                                </div>
                            </div>
                        )}

                        {selectedNode.details.revertible && (
                            <button
                                onClick={() => handleRevert(selectedNode.id)}
                                style={{
                                    marginTop: "10px",
                                    marginBottom: "20px",
                                    background: "rgba(244, 63, 94, 0.1)",
                                    border: "1px solid rgba(244, 63, 94, 0.3)",
                                    color: "#f43f5e",
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    width: "100%",
                                    justifyContent: "center"
                                }}
                            >
                                <RotateCcw size={16} /> Revert to this State
                            </button>
                        )}

                        <div style={{ marginTop: "20px" }}>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Raw Data</div>
                            <pre style={{
                                background: "var(--bg-deep)",
                                padding: "12px",
                                borderRadius: "8px",
                                overflowX: "auto",
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border)",
                                whiteSpace: "pre-wrap"
                            }}>
                                {JSON.stringify(selectedNode.details, null, 2)}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>
                        Select a node to view details
                    </div>
                )}
            </div>
        </div>
    );
};
