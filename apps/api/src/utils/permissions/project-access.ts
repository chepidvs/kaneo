import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../database";

export function isWorkspaceManager(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function isWorkspaceOwner(role?: string | null) {
  return role === "owner";
}

export function canManageProjectAccess(role?: string | null) {
  return role === "owner";
}

export function canManageWorkspaceRole(role?: string | null) {
  return role === "owner";
}

export async function getWorkspaceRole(userId: string, workspaceId: string) {
  const [membership] = await db
    .select({ role: schema.workspaceUserTable.role })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.userId, userId),
        eq(schema.workspaceUserTable.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  return membership?.role ?? null;
}

export async function canAccessProject(params: {
  userId: string;
  workspaceId: string;
  projectId: string;
  isPublic?: boolean | null;
}) {
  const workspaceRole = await getWorkspaceRole(
    params.userId,
    params.workspaceId,
  );

  if (!workspaceRole) return false;
  if (isWorkspaceOwner(workspaceRole)) return true;
  if (params.isPublic) return true;

  const [projectMember] = await db
    .select({ id: schema.projectMemberTable.id })
    .from(schema.projectMemberTable)
    .where(
      and(
        eq(schema.projectMemberTable.workspaceId, params.workspaceId),
        eq(schema.projectMemberTable.projectId, params.projectId),
        eq(schema.projectMemberTable.userId, params.userId),
      ),
    )
    .limit(1);

  return Boolean(projectMember);
}

export async function assertCanAccessProject(params: {
  userId: string;
  workspaceId: string;
  projectId: string;
  isPublic?: boolean | null;
}) {
  const allowed = await canAccessProject(params);

  if (!allowed) {
    throw new HTTPException(403, {
      message: "You don't have access to this project",
    });
  }
}
