export declare class WorkspaceManager {
    private baseDir;
    constructor(baseDir?: string);
    /**
     * Ensures a workspace exists for the given user ID.
     */
    ensureWorkspace(userId: string): string;
    /**
     * Returns the absolute path to a user's workspace.
     */
    getWorkspacePath(userId: string): string;
    /**
     * Resolves a relative path within a user's workspace.
     * Throws an error if the path attempts to escape the workspace.
     */
    resolvePath(userId: string, relativePath: string): string;
}
export declare const workspaceManager: WorkspaceManager;
//# sourceMappingURL=WorkspaceManager.d.ts.map