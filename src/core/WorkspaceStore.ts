import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { simpleGit } from "simple-git";

export interface Workspace {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    isActive: boolean;
}

interface WorkspaceStoreData {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
}

class WorkspaceStore {
    private dataPath: string;
    private data: WorkspaceStoreData;

    constructor() {
        const appName = "mcp-sandbox";
        const home = os.homedir();
        const userDataPath = process.platform === "win32"
            ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), appName)
            : process.platform === "darwin"
                ? path.join(home, "Library", "Application Support", appName)
                : path.join(home, ".config", appName);

        this.dataPath = path.join(userDataPath, "workspaces.json");
        this.data = this.load();
    }

    private load(): WorkspaceStoreData {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, "utf-8");
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error("WorkspaceStore: Failed to load data:", e);
        }
        return { workspaces: [], activeWorkspaceId: null };
    }

    private save(): void {
        try {
            fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
        } catch (e) {
            console.error("WorkspaceStore: Failed to save data:", e);
        }
    }

    list(): Workspace[] {
        return this.data.workspaces.map((w) => ({
            ...w,
            isActive: w.id === this.data.activeWorkspaceId,
        }));
    }

    async create(name: string, dirPath: string): Promise<Workspace> {
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Path does not exist: ${dirPath}`);
        }
        const stat = fs.statSync(dirPath);
        if (!stat.isDirectory()) {
            throw new Error(`Path is not a directory: ${dirPath}`);
        }

        // Validate that directory is a Git repository
        const git = simpleGit(dirPath);
        try {
            const isRepo = await git.checkIsRepo();
            if (!isRepo) {
                throw new Error(`The directory "${dirPath}" is not a Git repository. Admins can only register workspaces that are connected to Git.`);
            }
        } catch (err: any) {
            throw new Error(`Git validation failed: ${err.message || String(err)}`);
        }

        const existing = this.data.workspaces.find((w) => w.path === path.resolve(dirPath));
        if (existing) {
            throw new Error(`Workspace already registered for path: ${dirPath}`);
        }

        const workspace: Workspace = {
            id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            path: path.resolve(dirPath),
            createdAt: new Date().toISOString(),
            isActive: false,
        };

        this.data.workspaces.push(workspace);

        if (this.data.workspaces.length === 1) {
            this.data.activeWorkspaceId = workspace.id;
        }

        this.save();
        return { ...workspace, isActive: workspace.id === this.data.activeWorkspaceId };
    }

    delete(id: string): void {
        const idx = this.data.workspaces.findIndex((w) => w.id === id);
        if (idx === -1) throw new Error(`Workspace not found: ${id}`);
        this.data.workspaces.splice(idx, 1);
        if (this.data.activeWorkspaceId === id) {
            this.data.activeWorkspaceId = this.data.workspaces[0]?.id ?? null;
        }
        this.save();
    }

    setActive(id: string): void {
        const ws = this.data.workspaces.find((w) => w.id === id);
        if (!ws) throw new Error(`Workspace not found: ${id}`);
        this.data.activeWorkspaceId = id;
        this.save();
    }

    getActive(): Workspace | null {
        if (!this.data.activeWorkspaceId) return null;
        const ws = this.data.workspaces.find((w) => w.id === this.data.activeWorkspaceId);
        return ws ? { ...ws, isActive: true } : null;
    }

    getActivePath(): string | null {
        const ws = this.getActive();
        return ws ? ws.path : null;
    }
}

export const workspaceStore = new WorkspaceStore();
