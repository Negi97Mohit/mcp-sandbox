import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config/env.js';
import { workspaceStore } from './WorkspaceStore.js';
import { notifyAdmin } from './NotificationManager.js';
import { simpleGit } from 'simple-git';

export type PermissionLevel = 'read' | 'write' | 'admin' | 'none';

interface PermissionData {
    users: {
        [userId: string]: {
            role: PermissionLevel;
            grantedAt: string;
            grantedBy?: string | undefined;
            workspaceId?: string | undefined;
            canManageTools?: boolean | undefined;
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
        const resolvedWorkspaceId = workspaceId !== undefined ? workspaceId : existing?.workspaceId;

        this.data.users[targetUserId] = {
            role,
            workspaceId: resolvedWorkspaceId,
            canManageTools: canManageTools !== undefined ? canManageTools : existing?.canManageTools,
            grantedAt: new Date().toISOString(),
            grantedBy: adminUserId
        };
        this.saveData();

        // If assigned a workspace and role is active, trigger automated onboarding branch & notification setup
        if (resolvedWorkspaceId && role !== 'none') {
            this.setupUserBranchAndNotify(targetUserId, role, resolvedWorkspaceId).catch(err => {
                console.error("Failed in setupUserBranchAndNotify:", err);
            });
        }
    }

    private async setupUserBranchAndNotify(targetUserId: string, role: PermissionLevel, workspaceId: string) {
        try {
            const workspace = workspaceStore.list().find(w => w.id === workspaceId);
            if (!workspace) {
                await notifyAdmin(`⚠️ Permissions updated for user \`${targetUserId}\`, but the assigned workspace \`${workspaceId}\` could not be found.`);
                return;
            }

            const git = simpleGit(workspace.path);
            const isRepo = await git.checkIsRepo();
            if (!isRepo) {
                await notifyAdmin(`⚠️ Permissions updated for user \`${targetUserId}\` in workspace **${workspace.name}**, but the directory is not a Git repository.`);
                return;
            }

            const branchName = `user-${targetUserId}`;
            const localBranches = await git.branchLocal();
            
            if (localBranches.all.includes(branchName)) {
                await notifyAdmin(`👥 Permissions updated for user \`${targetUserId}\` in workspace **${workspace.name}**.\n🌿 Git branch \`${branchName}\` already exists locally.`);
                return;
            }

            // Create and checkout branch
            await git.checkoutLocalBranch(branchName);
            
            let pushedMsg = "";
            try {
                const remotes = await git.getRemotes();
                if (remotes.some(r => r.name === 'origin')) {
                    await git.push('origin', branchName, { '--set-upstream': null });
                    pushedMsg = " and pushed to remote origin";
                } else {
                    pushedMsg = " (no remote origin configured)";
                }
            } catch (pushErr: any) {
                pushedMsg = ` (failed to push to origin: ${pushErr.message || String(pushErr)})`;
            }

            await notifyAdmin(`✅ **New User Onboarded!**\n👤 User ID: \`${targetUserId}\`\n💼 Role: \`${role}\`\n📂 Workspace: **${workspace.name}** (${workspace.path})\n🌿 Automatically created Git branch \`${branchName}\`${pushedMsg}.`);
        } catch (err: any) {
            console.error("Failed in setupUserBranchAndNotify:", err);
            await notifyAdmin(`❌ **Onboarding Error**\nFailed to setup Git branch for user \`${targetUserId}\`:\n\`\`\`text\n${err.message || String(err)}\n\`\`\``);
        }
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

    public getWorkspaceId(userId: string): string | undefined {
        return this.data.users[userId]?.workspaceId;
    }

    public canManageTools(userId: string): boolean {
        if (this.isAdmin(userId)) return true;
        return !!this.data.users[userId]?.canManageTools;
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

    public listAll(): { userId: string; role: PermissionLevel; workspaceId?: string; canManageTools?: boolean }[] {
        return Object.entries(this.data.users).map(([userId, data]) => {
            const item: { userId: string; role: PermissionLevel; workspaceId?: string; canManageTools?: boolean } = {
                userId,
                role: data.role,
                canManageTools: !!data.canManageTools
            };
            if (data.workspaceId !== undefined) {
                item.workspaceId = data.workspaceId;
            }
            return item;
        });
    }
}

export const permissionManager = new PermissionManager();
