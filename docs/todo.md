# KANEO — TODO

## v2.7.4 — Role & Permission System ✔

### Done
- New `guest` role (below member in hierarchy)
- `workspace_role_permissions` table (per-workspace custom permissions)
- Admin auto-bypass project access removed (now follows membership like Member)
- GET/PUT `/workspace/:id/role-permissions` endpoints (owner only for PUT)
- Settings UI: checklist matrix di `/settings/workspace/roles`
- Locked OFF: `workspace.delete`, `team.manage_roles`
- Locked ON: `workspace.read`, `project.read`, `task.read`

---

## v2.7.5 — UX & Notification Polish ✔

### Done
- Saved filter views on board toolbar
- Clone task from context menu
- Favourite/pinned projects in sidebar + sorted alphabetically
- Close button on in-app notification toast
- Smoother kanban drag & drop
- Project-scoped notifications (no longer workspace-wide)
- Edit existing comments fix
- Copy task detail URL fix
- Module filter dropdown truncation fix
- Label max-width fix in task detail sidebar

---

## v2.7.6 — TBD

---

## Future (NOT NOW)
- WebSocket / SSE
- Notification settings UI
- Advanced permission
- Analytics