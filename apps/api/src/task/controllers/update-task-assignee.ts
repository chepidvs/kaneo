import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskAssigneeTable, taskTable } from "../../database/schema";

async function updateTaskAssignee({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const existingTask = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!existingTask) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  await db.delete(taskAssigneeTable).where(eq(taskAssigneeTable.taskId, id));

  if (userId) {
    await db
      .insert(taskAssigneeTable)
      .values({ taskId: id, userId })
      .onConflictDoNothing({
        target: [taskAssigneeTable.taskId, taskAssigneeTable.userId],
      });
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({ userId: userId || null })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update task assignee",
    });
  }

  return updatedTask;
}

export default updateTaskAssignee;
