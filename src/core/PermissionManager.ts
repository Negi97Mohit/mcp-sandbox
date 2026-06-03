import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config/env.js';

export type PermissionLevel = 'read' | 'write' | 'admin' | 'none';

interface PermissionData {
    users: {
        [userId: string]: {
            role: PermissionLevel;
            grantedAt: string;
            grantedBy?: string;
            workspaceId?: string;
            canManageTools?: boolean;
        };
    };
}

export class PermissionManager {
    private dbPath: string;
    private data: PermissionData;

    constructor() {
        this.dbPath = path.join(process.cwd(), 'permissions.json');
        this.data = this.loadData();
    }

    private loadData(): PermissionData {
        if (!fs.existsSync(this.dbPath)) {
            return { users: {} };
        }
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        } catch (error) {
            console.error('Failed to load permissions.json, resetting db', error);
            return { users: {} };
        }
    }

    private saveData() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    }

    public grant(adminUserId: string, targetUserId: string, role: PermissionLevel, workspaceId?: string, canManageTools?: boolean) {
        if (!this.isAdmin(adminUserId)) {
            throw new Error('Only admins can grant permissions');
        }

        const existing = this.data.users[targetUserId];
        const newUser: any = {
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

    public revoke(adminUserId: string, targetUserId: string) {
        if (!this.isAdmin(adminUserId)) {
            throw new Error('Only admins can revoke permissions');
        }

        if (this.data.users[targetUserId]) {
            delete this.data.users[targetUserId];
            this.saveData();
        }
    }

    public getRole(userId: string): PermissionLevel {
        // Super Admin defined in env always has admin access
        if (CONFIG.ALLOWED_USER_ID && userId === CONFIG.ALLOWED_USER_ID) {
            return 'admin';
        }
        return this.data.users[userId]?.role || 'none';
    }

    public isAdmin(userId: string): boolean {
        return this.getRole(userId) === 'admin';
    }

    public canWrite(userId: string): boolean {
        const role = this.getRole(userId);
        return role === 'write' || role === 'admin';
    }

    public canRead(userId: string): boolean {
        const role = this.getRole(userId);
        return role !== 'none';
    }

    public canManageTools(userId: string): boolean {
        if (userId === "desktop-admin" || this.isAdmin(userId)) {
            return true;
        }
        return !!this.data.users[userId]?.canManageTools;
    }

    public listAll(): { userId: string; role: PermissionLevel; workspaceId?: string; canManageTools?: boolean }[] {
        return Object.entries(this.data.users).map(([userId, data]) => {
            const item: any = {
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
