export interface Workspace {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    isActive: boolean;
}
declare class WorkspaceStore {
    private dataPath;
    private data;
    constructor();
    private load;
    private save;
    list(): Workspace[];
    create(name: string, dirPath: string): Promise<Workspace>;
    delete(id: string): void;
    setActive(id: string): void;
    getActive(): Workspace | null;
    getActivePath(): string | null;
}
export declare const workspaceStore: WorkspaceStore;
export {};
//# sourceMappingURL=WorkspaceStore.d.ts.map