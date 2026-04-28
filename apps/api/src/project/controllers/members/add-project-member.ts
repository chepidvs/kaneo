import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../../database";
import {
  canManageProjectAccess,
  getWorkspaceRole,
} from "../../../utils/permissions/project-access";

async function addProjectMember(params: {
  actorUserId: string;
  workspaceId: string;
  projectId: string;
  userId: string;
  role: string;
}) {
  const actorRole = await getWorkspaceRole(
    params.actorUserId,
    params.workspaceId,
  );

  if (!canManageProjectAccess(actorRole)) {
    throw new HTTPException(403, {
      message: "Only workspace owner can manage project access",
    });
  }

  const [workspaceMember] = await db
    .select({ id: schema.workspaceUserTable.id })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.workspaceId, params.workspaceId),
        eq(schema.workspaceUserTable.userId, params.userId),
      ),
    )
    .limit(1);

  if (!workspaceMember) {
    throw new HTTPException(400, {
      message: "User is not a member of this workspace",
    });
  }

  const [projectMember] = await db
    .insert(schema.projectMemberTable)
    .values({
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      userId: params.userId,
      role: params.role,
    })
    .onConflictDoUpdate({
      target: [
        schema.projectMemberTable.projectId,
        schema.projectMemberTable.userId,
      ],
      set: {
        role: params.role,
      },
    })
    .returning();

  return projectMember;
}

export default addProjectMember;
