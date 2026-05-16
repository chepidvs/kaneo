# KANEO — DECISIONS

## Mentions System
- Use Option A (no separate mention table)
- Simple, fast, MVP-friendly
- Future upgrade: Option B (scalable mention table)

## UI Strategy
- Use optimistic UI for:
  - labels
  - comments
  - roles
- Goal: instant feedback, no delay

## Activity System
- Use polling (5s)
- Not using WebSocket (yet)

## Dev Workflow (STRICT)
LOCAL → TEST → COMMIT → PUSH → DEPLOY

Rules:
- No edit on VPS
- No skip commit
- Always test local first

## Module & Page (v2.7.3)
Decision:
- Direct implementation (NOT phased)

Status: ✔ Done

## Role & Permission System (v2.7.4)
Decisions:
- Guest role added (hierarchy: Owner > Admin > Member > Guest)
- Admin no longer auto-bypasses project access (now requires explicit project membership like Member)
- Owner always auto-bypasses all project access
- Permission matrix stored per-workspace in `workspace_role_permissions` table
- Locked OFF for all roles: `workspace.delete`, `team.manage_roles`
- Locked ON for all roles: `workspace.read`, `project.read`, `task.read`
- Only Owner can update permissions via settings UI

Status: ✔ Done