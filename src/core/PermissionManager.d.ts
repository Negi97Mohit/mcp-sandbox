export type PermissionLevel = 'read' | 'write' | 'admin' | 'none';
export declare class PermissionManager {
    private dbPath;
    private data;
    constructor();
    private loadData;
    private saveData;
    grant(adminUserId: string, targetUserId: string, role: PermissionLevel): void;
    revoke(adminUserId: string, targetUserId: string): void;
    getRole(userId: string): PermissionLevel;
    isAdmin(userId: string): boolean;
    canWrite(userId: string): boolean;
    canRead(userId: string): boolean;
    listAll(): {
        userId: string;
        role: PermissionLevel;
    }[];
}
export declare const permissionManager: PermissionManager;
//# sourceMappingURL=PermissionManager.d.ts.map