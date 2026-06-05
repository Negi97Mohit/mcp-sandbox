export interface GraphNode {
    id: string;
    parentId: string | null;
    timestamp: string;
    type: "app_start" | "user_request" | "agent_plan" | "agent_implement" | "agent_verify" | "agent_decision" | "user_action" | "checkpoint";
    label: string;
    status: "idle" | "running" | "success" | "failed" | "escalated" | "aborted" | "reverted";
    createdBy: string;
    colorCode: string;
    details: {
        description?: string;
        plan?: any;
        modifiedFiles?: string[];
        diff?: string;
        verificationReport?: any;
        decision?: string;
        revertible?: boolean;
        gitCommitHash?: string;
        [key: string]: any;
    };
}
export interface GraphData {
    nodes: GraphNode[];
    activeNodeId: string | null;
}
declare class GraphStore {
    private userDataPath;
    private sessionId;
    dataPath: string;
    private data;
    private listeners;
    constructor();
    private load;
    private save;
    private initialize;
    /**
     * Lists all available past graph sessions
     */
    listSessions(): {
        id: string;
        timestamp: string;
        nodeCount: number;
    }[];
    /**
     * Loads a specific session ID to be active
     */
    loadSession(sessionId: string): boolean;
    /**
     * Starts a completely new session
     */
    startNewSession(): void;
    getGraph(): GraphData;
    onChange(listener: (graph: GraphData) => void): void;
    private notify;
    /**
     * Appends a node branching from the active node (or parentId if provided)
     */
    addNode(nodeData: Partial<GraphNode>): GraphNode;
    /**
     * Updates an existing node by ID
     */
    updateNode(id: string, updates: Partial<GraphNode>): GraphNode | null;
    /**
     * Sets the active node pointer without adding a node (useful when navigating history)
     */
    setActiveNode(id: string): boolean;
    /**
     * Captures a Git checkpoint (commit) for the active workspace
     */
    captureGitCheckpoint(nodeId: string, label: string): Promise<string | null>;
    /**
     * Reverts the workspace to the state stored at the node ID
     */
    revertToNode(nodeId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Wipes the graph history and re-initializes it (starts fresh)
     */
    clearGraph(): void;
}
export declare const graphStore: GraphStore;
export {};
//# sourceMappingURL=GraphStore.d.ts.map