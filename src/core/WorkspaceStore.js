import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
class WorkspaceStore {
    dataPath;
    data;
    constructor() {
        const userDataPath = app.getPath("userData");
        this.dataPath = path.join(userDataPath, "workspaces.json");
        this.data = this.load();
    }
    load() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, "utf-8");
                return JSON.parse(raw);
            }
        }
        catch (e) {
            console.error("WorkspaceStore: Failed to load data:", e);
        }
        return { workspaces: [], activeWorkspaceId: null };
    }
    save() {
        try {
            fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
        }
        catch (e) {
            console.error("WorkspaceStore: Failed to save data:", e);
        }
    }
    list() {
        return this.data.workspaces.map((w) => ({
            ...w,
            isActive: w.id === this.data.activeWorkspaceId,
        }));
    }
    create(name, dirPath) {
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Path does not exist: ${dirPath}`);
        }
        const stat = fs.statSync(dirPath);
        if (!stat.isDirectory()) {
            throw new Error(`Path is not a directory: ${dirPath}`);
        }
        const existing = this.data.workspaces.find((w) => w.path === path.resolve(dirPath));
        if (existing) {
            throw new Error(`Workspace already registered for path: ${dirPath}`);
        }
        const workspace = {
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
    delete(id) {
        const idx = this.data.workspaces.findIndex((w) => w.id === id);
        if (idx === -1)
            throw new Error(`Workspace not found: ${id}`);
        this.data.workspaces.splice(idx, 1);
        if (this.data.activeWorkspaceId === id) {
            this.data.activeWorkspaceId = this.data.workspaces[0]?.id ?? null;
        }
        this.save();
    }
    setActive(id) {
        const ws = this.data.workspaces.find((w) => w.id === id);
        if (!ws)
            throw new Error(`Workspace not found: ${id}`);
        this.data.activeWorkspaceId = id;
        this.save();
    }
    getActive() {
        if (!this.data.activeWorkspaceId)
            return null;
        const ws = this.data.workspaces.find((w) => w.id === this.data.activeWorkspaceId);
        return ws ? { ...ws, isActive: true } : null;
    }
    getActivePath() {
        const ws = this.getActive();
        return ws ? ws.path : null;
    }
}
export const workspaceStore = new WorkspaceStore();
//# sourceMappingURL=WorkspaceStore.js.map