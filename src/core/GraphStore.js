import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { simpleGit } from "simple-git";
import { workspaceStore } from "./WorkspaceStore.js";
class GraphStore {
    userDataPath;
    sessionId;
    dataPath;
    data;
    listeners = [];
    constructor() {
        const appName = "mcp-sandbox";
        const home = os.homedir();
        this.userDataPath = process.platform === "win32"
            ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), appName)
            : process.platform === "darwin"
                ? path.join(home, "Library", "Application Support", appName)
                : path.join(home, ".config", appName);
        this.sessionId = `session_${Date.now()}`;
        this.dataPath = path.join(this.userDataPath, "graphs", `${this.sessionId}.json`);
        this.data = this.load();
        // If empty, initialize with App Start
        if (this.data.nodes.length === 0) {
            this.initialize();
        }
    }
    load() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, "utf-8");
                return JSON.parse(raw);
            }
        }
        catch (e) {
            // Probably doesn't exist yet, which is fine
        }
        return { nodes: [], activeNodeId: null };
    }
    save() {
        try {
            fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
            this.notify();
        }
        catch (e) {
            console.error("GraphStore: Failed to save graph history:", e);
        }
    }
    initialize() {
        const rootNode = {
            id: `node_start_${Date.now()}`,
            parentId: null,
            timestamp: new Date().toISOString(),
            type: "app_start",
            label: "Gaki App Initialized",
            status: "success",
            createdBy: "system",
            colorCode: "indigo",
            details: {
                description: "Studio startup and environment tracking initialized."
            }
        };
        this.data.nodes = [rootNode];
        this.data.activeNodeId = rootNode.id;
        this.save();
    }
    /**
     * Lists all available past graph sessions
     */
    listSessions() {
        const graphsDir = path.join(this.userDataPath, "graphs");
        if (!fs.existsSync(graphsDir))
            return [];
        const files = fs.readdirSync(graphsDir).filter(f => f.endsWith(".json"));
        const sessions = [];
        for (const file of files) {
            try {
                const raw = fs.readFileSync(path.join(graphsDir, file), "utf-8");
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.nodes)) {
                    sessions.push({
                        id: file.replace(".json", ""),
                        timestamp: parsed.nodes[0]?.timestamp || new Date().toISOString(),
                        nodeCount: parsed.nodes.length
                    });
                }
            }
            catch (e) {
                // Ignore malformed files
            }
        }
        // Sort by timestamp descending
        return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    /**
     * Loads a specific session ID to be active
     */
    loadSession(sessionId) {
        const newPath = path.join(this.userDataPath, "graphs", `${sessionId}.json`);
        if (fs.existsSync(newPath)) {
            this.sessionId = sessionId;
            this.dataPath = newPath;
            this.data = this.load();
            this.notify();
            return true;
        }
        return false;
    }
    /**
     * Starts a completely new session
     */
    startNewSession() {
        this.sessionId = `session_${Date.now()}`;
        this.dataPath = path.join(this.userDataPath, "graphs", `${this.sessionId}.json`);
        this.data = { nodes: [], activeNodeId: null };
        this.initialize();
        this.notify();
    }
    getGraph() {
        return {
            nodes: [...this.data.nodes],
            activeNodeId: this.data.activeNodeId
        };
    }
    onChange(listener) {
        this.listeners.push(listener);
    }
    notify() {
        const graph = this.getGraph();
        for (const l of this.listeners) {
            try {
                l(graph);
            }
            catch (err) {
                console.error("GraphStore notification error:", err);
            }
        }
    }
    /**
     * Appends a node branching from the active node (or parentId if provided)
     */
    addNode(nodeData) {
        const parentId = nodeData.parentId !== undefined ? nodeData.parentId : this.data.activeNodeId;
        const node = {
            id: nodeData.id || `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            parentId,
            timestamp: nodeData.timestamp || new Date().toISOString(),
            type: nodeData.type || "user_request",
            label: nodeData.label || "Action Step",
            status: nodeData.status || "idle",
            createdBy: nodeData.createdBy || "system",
            colorCode: nodeData.colorCode || "emerald",
            details: nodeData.details || {},
        };
        this.data.nodes.push(node);
        this.data.activeNodeId = node.id;
        this.save();
        return node;
    }
    /**
     * Updates an existing node by ID
     */
    updateNode(id, updates) {
        const idx = this.data.nodes.findIndex(n => n.id === id);
        if (idx === -1)
            return null;
        const existing = this.data.nodes[idx];
        const updatedDetails = { ...existing.details, ...updates.details };
        const updatedNode = {
            ...existing,
            ...updates,
            details: updatedDetails
        };
        this.data.nodes[idx] = updatedNode;
        this.save();
        return updatedNode;
    }
    /**
     * Sets the active node pointer without adding a node (useful when navigating history)
     */
    setActiveNode(id) {
        if (this.data.nodes.some(n => n.id === id)) {
            this.data.activeNodeId = id;
            this.save();
            return true;
        }
        return false;
    }
    /**
     * Captures a Git checkpoint (commit) for the active workspace
     */
    async captureGitCheckpoint(nodeId, label) {
        const wsPath = workspaceStore.getActivePath();
        if (!wsPath)
            return null;
        try {
            const git = simpleGit(wsPath);
            const isRepo = await git.checkIsRepo();
            if (!isRepo)
                return null;
            // Check if there are changes to stage
            const status = await git.status();
            const hasChanges = status.files.length > 0;
            if (hasChanges) {
                await git.add("-A");
                const commitResult = await git.commit(`[Gaki Checkpoint] ${label} (${nodeId})`, {
                    "--allow-empty": null
                });
                const hash = commitResult.commit;
                console.log(`Git Checkpoint captured: ${hash}`);
                return hash;
            }
            else {
                // If clean, capture current HEAD hash
                const hash = await git.revparse("HEAD");
                return hash.trim();
            }
        }
        catch (e) {
            console.error("GraphStore: Failed to capture Git checkpoint:", e);
            return null;
        }
    }
    /**
     * Reverts the workspace to the state stored at the node ID
     */
    async revertToNode(nodeId) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        if (!node) {
            return { success: false, error: `Node "${nodeId}" not found.` };
        }
        const commitHash = node.details.gitCommitHash;
        if (!commitHash) {
            return { success: false, error: "Node has no associated Git checkpoint/commit hash." };
        }
        const wsPath = workspaceStore.getActivePath();
        if (!wsPath) {
            return { success: false, error: "No active workspace configured to revert." };
        }
        try {
            const git = simpleGit(wsPath);
            const isRepo = await git.checkIsRepo();
            if (!isRepo)
                throw new Error("Workspace is not a valid Git repository.");
            // Verify the commit exists
            await git.catFile(["-t", commitHash]);
            // Perform hard reset and clean
            console.log(`Reverting workspace to commit ${commitHash}...`);
            await git.reset(["--hard", commitHash]);
            await git.clean("f", ["-d"]);
            // Update node status & active node pointer
            this.updateNode(nodeId, { status: "reverted" });
            this.data.activeNodeId = nodeId;
            // Add a revert action node
            this.addNode({
                type: "user_action",
                label: `Reverted to: ${node.label}`,
                status: "success",
                createdBy: "user:desktop-admin",
                colorCode: "rose",
                details: {
                    description: `Workspace reverted to node: ${node.label} (${node.id})`,
                    revertedNodeId: nodeId,
                    gitCommitHash: commitHash
                }
            });
            this.save();
            return { success: true };
        }
        catch (e) {
            console.error("GraphStore: Failed to revert to checkpoint:", e);
            return { success: false, error: e.message || String(e) };
        }
    }
    /**
     * Wipes the graph history and re-initializes it (starts fresh)
     */
    clearGraph() {
        this.startNewSession();
    }
}
export const graphStore = new GraphStore();
//# sourceMappingURL=GraphStore.js.map