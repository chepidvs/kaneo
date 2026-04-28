import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../../database";
import {
  canManageProjectAccess,
  getWorkspaceRole,
} from "../../../utils/permissions/project-access";

async function removeProjectMember(params: {
  actorUserId: string;
  workspaceId: string;
  projectId: string;
  userId: string;
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

  const [deletedProjectMember] = await db
    .delete(schema.projectMemberTable)
    .where(
      and(
        eq(schema.projectMemberTable.workspaceId, params.workspaceId),
        eq(schema.projectMemberTable.projectId, params.projectId),
        eq(schema.projectMemberTable.userId, params.userId),
      ),
    )
    .returning();

  return deletedProjectMember ?? { success: true };
}

export default removeProjectMember;
