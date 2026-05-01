import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { commentTable, workspaceUserTable } from "../../database/schema";

async function deleteComment(userId: string, id: string, workspaceId: string) {
  const [existing] = await db
    .select({ userId: commentTable.userId })
    .from(commentTable)
    .where(eq(commentTable.id, id))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: "Comment not found" });
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

  const [deleted] = await db
    .delete(commentTable)
    .where(eq(commentTable.id, id))
    .returning();

  if (!deleted) {
    throw new HTTPException(500, { message: "Failed to delete comment" });
  }

  return deleted;
}

export default deleteComment;
