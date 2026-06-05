import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config/env.js';
export class PermissionManager {
    dbPath;
    data;
    constructor() {
        this.dbPath = path.join(process.cwd(), 'permissions.json');
        this.data = this.loadData();
    }
    loadData() {
        if (!fs.existsSync(this.dbPath)) {
            return { users: {} };
        }
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        }
        catch (error) {
            console.error('Failed to load permissions.json, resetting db', error);
            return { users: {} };
        }
    }
    saveData() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    }
    grant(adminUserId, targetUserId, role, workspaceId, canManageTools) {
        if (!this.isAdmin(adminUserId)) {
            throw new Error('Only admins can grant permissions');
        }
        const existing = this.data.users[targetUserId];
        const newUser = {
            role,
            grantedAt: new Date().toISOString(),
            grantedBy: adminUserId,
        };
        const wsId = workspaceId !== undefined ? workspaceId : existing?.workspaceId;
        if (wsId !== undefined) {
            newUser.workspaceId = wsId;
        }
        const mTools = canManageTools !== undefined ? canManageTools : existing?.canManageTools;
        if (mTools !== undefined) {
            newUser.canManageTools = mTools;
        }
        this.data.users[targetUserId] = newUser;
        this.saveData();
    }
    revoke(adminUserId, targetUserId) {
        if (!this.isAdmin(adminUserId)) {
            throw new Error('Only admins can revoke permissions');
        }
        if (this.data.users[targetUserId]) {
            delete this.data.users[targetUserId];
            this.saveData();
        }
    }
    getRole(userId) {
        // Super Admin defined in env always has admin access
        if (CONFIG.ALLOWED_USER_ID && userId === CONFIG.ALLOWED_USER_ID) {
            return 'admin';
        }
        return this.data.users[userId]?.role || 'none';
    }
    isAdmin(userId) {
        return this.getRole(userId) === 'admin';
    }
    canWrite(userId) {
        const role = this.getRole(userId);
        return role === 'write' || role === 'admin';
    }
    canRead(userId) {
        const role = this.getRole(userId);
        return role !== 'none';
    }
    canManageTools(userId) {
        if (userId === "desktop-admin" || this.isAdmin(userId)) {
            return true;
        }
        return !!this.data.users[userId]?.canManageTools;
    }
    getWorkspaceId(userId) {
        return this.data.users[userId]?.workspaceId;
    }
    listAll() {
        return Object.entries(this.data.users).map(([userId, data]) => {
            const item = {
                userId,
                role: data.role,
            };
            if (data.workspaceId !== undefined) {
                item.workspaceId = data.workspaceId;
            }
            if (data.canManageTools !== undefined) {
                item.canManageTools = data.canManageTools;
            }
            return item;
        });
    }
}
export const permissionManager = new PermissionManager();
//# sourceMappingURL=PermissionManager.js.map