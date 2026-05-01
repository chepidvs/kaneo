import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { activityTable, workspaceUserTable } from "../../database/schema";

async function deleteComment(userId: string, id: string, workspaceId: string) {
  const [existing] = await db
    .select({
      type: activityTable.type,
      userId: activityTable.userId,
      externalSource: activityTable.externalSource,
    })
    .from(activityTable)
    .where(eq(activityTable.id, id))
    .limit(1);

  if (!existing || existing.type !== "comment") {
    throw new HTTPException(404, { message: "Comment not found" });
  }

  if (existing.externalSource || !existing.userId) {
    throw new HTTPException(403, {
      message: "External comments cannot be deleted",
    });
  }

  if (existing.userId !== userId) {
    const [workspaceMember] = await db
      .select({ role: workspaceUserTable.role })
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, workspaceId),
          eq(workspaceUserTable.userId, userId),
        ),
      )
      .limit(1);

    if (workspaceMember?.role !== "owner") {
      throw new HTTPException(403, {
        message: "Only the author or workspace owner can delete this comment",
      });
    }
  }

  const [deletedComment] = await db
    .delete(activityTable)
    .where(eq(activityTable.id, id))
    .returning();

  if (!deletedComment) {
    throw new HTTPException(500, { message: "Failed to delete comment" });
  }

  return deletedComment;
}

export default deleteComment;
