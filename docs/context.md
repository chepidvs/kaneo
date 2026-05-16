# KANEO — CONTEXT

## Project
Kaneo = self-hosted project management tool (Plane.so alternative)

## Goal
- lightweight
- fast UX
- scalable
- internal usage

## Stack
Frontend:
- React (Vite)
- TanStack Query
- TipTap

Backend:
- Hono API
- Drizzle ORM
- PostgreSQL

Infra:
- VPS (Sumopod)
- Docker Compose
- Nginx
- Cloudflare R2 (storage)
- Gmail SMTP (email)

## Current Version
v2.7.5 | FRMWRK

## Status
Core system stable:
- Auth ✔
- Labels ✔ (optimistic UI)
- Comments ✔ (mentions + email, editing)
- Roles ✔ (optimistic UI)
- Attachment ✔
- Activity feed ✔ (polling)
- Module & Page system ✔ (v2.7.3)
- Role & Permission system ✔ (v2.7.4, Guest role + custom permission matrix)
- Saved filter views ✔ (v2.7.5)
- Clone task ✔ (v2.7.5)
- Favourite/pinned projects ✔ (v2.7.5)
- Project-scoped notifications ✔ (v2.7.5)

UX:
- smooth
- fast
- minimal flicker
- smoother kanban drag & drop (v2.7.5)

## Architecture (Current)
Workspace
→ Project
  → Module
    → Page
      → Task
        → Label
        → Comment
        → Activity

## Next Phase
v2.7.6 — TBD

## Principle
- clean architecture
- reusable entity
- avoid over-engineering
- MVP but scalable