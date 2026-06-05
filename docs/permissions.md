# 🔐 Permissions & RBAC

Gaki uses a **Role-Based Access Control (RBAC)** system to control what each Discord user (or desktop session) is allowed to do. Permissions are stored in a flat JSON file and enforced before any agent runs.

---

## In Plain English

Think of it like a company's access levels:
- **Admin** = Engineering manager. Can do everything: run agents, grant access to others, see health stats, manage tools.
- **Write** = Developer. Can run agents and modify code in their own sandbox.
- **Read** = Stakeholder or intern. Can ask questions and see results, but can't change anything.
- **None** = Unknown user. Gets rejected.

---

## Permission Levels

| Role | Can Run Agent | Can Write Files | Can Manage Tools | Admin Commands |
|---|---|---|---|---|
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `write` | ✅ | ✅ | ❌ (unless `canManageTools: true`) | ❌ |
| `read` | ✅ (read-only) | ❌ | ❌ | ❌ |
| `none` | ❌ | ❌ | ❌ | ❌ |

---

## The Permissions File

**File**: [`permissions.json`](../permissions.json)

This is the live permissions database. It's read on every request and written immediately after any grant/revoke.

```json
{
  "users": {
    "123456789012345678": {
      "role": "admin",
      "grantedAt": "2024-01-15T10:00:00.000Z",
      "grantedBy": "ALLOWED_USER_ID",
      "workspaceId": "ws-abc123",
      "canManageTools": true
    },
    "987654321098765432": {
      "role": "write",
      "grantedAt": "2024-01-16T12:00:00.000Z",
      "grantedBy": "123456789012345678",
      "workspaceId": "ws-xyz789"
    }
  }
}
```

---

## The Super Admin

The `ALLOWED_USER_ID` value in `.env` is the **super admin**. This user always has `admin` access regardless of what's in `permissions.json`. It cannot be revoked through Discord commands — only by changing `.env`.

```typescript
// From src/core/PermissionManager.ts
public getRole(userId: string): PermissionLevel {
  if (CONFIG.ALLOWED_USER_ID && userId === CONFIG.ALLOWED_USER_ID) {
    return 'admin';  // Super admin: always overrides DB
  }
  return this.data.users[userId]?.role || 'none';
}
```

---

## Permission Manager API

**File**: [`src/core/PermissionManager.ts`](../src/core/PermissionManager.ts)

```typescript
// Check what role a user has
permissionManager.getRole(userId: string): 'read' | 'write' | 'admin' | 'none'

// Check specific capabilities
permissionManager.isAdmin(userId: string): boolean
permissionManager.canWrite(userId: string): boolean      // write or admin
permissionManager.canRead(userId: string): boolean       // any role except none
permissionManager.canManageTools(userId: string): boolean

// Grant a role (only admins can do this)
permissionManager.grant(adminId, targetId, role, workspaceId?, canManageTools?)

// Revoke access (only admins can do this)
permissionManager.revoke(adminId, targetId)

// List all users
permissionManager.listAll(): { userId, role, workspaceId?, canManageTools? }[]
```

---

## Discord Commands (Admin Only)

These commands are typed in Discord and processed by the bot:

### Grant Access
```
!grant @username write
!grant @username admin
!grant @username read
```

Gives the mentioned Discord user the specified role. They get an isolated workspace automatically.

### Revoke Access
```
!revoke @username
```

Removes all permissions for that user. Their workspace is NOT deleted — just access is revoked.

### List All Users
```
!permissions list
```

Returns a formatted list of all users and their roles.

---

## Workspace Isolation

Every non-admin user gets an isolated workspace — a dedicated folder under `workspaces/` tied to their Discord user ID.

```
workspaces/
├── ws-123456789/    ← User A's isolated sandbox
│   ├── my-project/
│   └── ...
└── ws-987654321/    ← User B's isolated sandbox
    ├── another-project/
    └── ...
```

**What isolation means**:
- The `run_shell` tool starts them in their workspace root
- `cd` commands that try to navigate above their workspace root are rejected
- `write_file` with an absolute path outside their sandbox is rejected
- The Agent's `context.workspaceRoot` is set to their folder, enforced in every tool handler

**What it does NOT block**:
- Admin users (`role: 'admin'`) bypass all sandbox restrictions
- The desktop app always runs as `desktop-admin` with no sandbox

---

## Risk Classifier

**File**: [`src/core/riskClassifier.ts`](../src/core/riskClassifier.ts)

Even for admins, certain actions are classified as high or critical risk and always go through the **Human-in-the-Loop Gate** regardless of the user's role.

| Action | Risk Level | Requires Approval |
|---|---|---|
| `run_shell` (read commands) | Low | ❌ |
| `write_file` | Medium | ❌ |
| `git_stage` | Medium | ❌ |
| `github_create_pr` | High | ✅ |
| `netlify_deploy` | High | ✅ |
| `git push` | Critical | ✅ |
| `rm -rf` | Critical | ✅ (also blocked in implementer prompt) |

---

## Human-in-the-Loop Gate

**File**: [`src/core/approvalGate.ts`](../src/core/approvalGate.ts)

When a high-risk action is required, execution stops and a Discord embed is sent:

```
┌─────────────────────────────────────────┐
│ ⚠️ APPROVAL REQUIRED                    │
│                                         │
│ Action: Create PR "fix: auth bug #42"   │
│ Risk Level: HIGH                        │
│ Requested By: @mohit                    │
│                                         │
│ All 12 tests passing. Confidence: 88%   │
│                                         │
│ [Preview of changes...]                 │
│                                         │
│   ✅ Approve     ❌ Reject              │
└─────────────────────────────────────────┘
```

The system waits up to **5 minutes** for a reaction. If no response:
- Auto-rejected
- Staged changes are rolled back with `git checkout`
- User is notified

```typescript
const approval = await approvalGate.request({
  id: approvalGate.generateId(),
  channelId: context.channelId,
  requestedBy: context.userId,
  action: 'Create PR: "fix: auth bug"',
  reason: 'All 12 tests passing. Confidence: 88%',
  riskLevel: 'high',
  context: prBody.substring(0, 800),
  timeoutMs: 5 * 60 * 1000,  // 5 minutes
});

if (approval.outcome === 'approved') {
  // proceed
} else {
  // rollback
}
```
