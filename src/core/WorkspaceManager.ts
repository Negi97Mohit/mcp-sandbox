import * as fs from 'fs';
import * as path from 'path';

export class WorkspaceManager {
    private baseDir: string;

    constructor(baseDir: string = path.join(process.cwd(), 'workspaces')) {
        this.baseDir = baseDir;
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    /**
     * Ensures a workspace exists for the given user ID.
     */
    public ensureWorkspace(userId: string): string {
        const workspacePath = this.getWorkspacePath(userId);
        if (!fs.existsSync(workspacePath)) {
            fs.mkdirSync(workspacePath, { recursive: true });
        }
        return workspacePath;
    }

    /**
     * Returns the absolute path to a user's workspace.
     */
    public getWorkspacePath(userId: string): string {
        // Sanitize userId to prevent traversal (though unlikely with discord IDs)
        const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
        return path.join(this.baseDir, safeId);
    }

    /**
     * Resolves a relative path within a user's workspace.
     * Throws an error if the path attempts to escape the workspace.
     */
    public resolvePath(userId: string, relativePath: string): string {
        const workspaceRoot = this.getWorkspacePath(userId);
        const resolved = path.resolve(workspaceRoot, relativePath);

        if (!resolved.startsWith(workspaceRoot)) {
            throw new Error(`Access denied: Path escapes workspace root. Target: ${resolved}, Root: ${workspaceRoot}`);
        }
        return resolved;
    }
}

export const workspaceManager = new WorkspaceManager();
