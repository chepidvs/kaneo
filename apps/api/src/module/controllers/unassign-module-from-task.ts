import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskModuleTable } from "../../database/schema";

async function unassignModuleFromTask(moduleId: string, taskId: string) {
  const [deleted] = await db
    .delete(taskModuleTable)
    .where(
      and(
        eq(taskModuleTable.moduleId, moduleId),
        eq(taskModuleTable.taskId, taskId),
      ),
    )
    .returning();

  if (!deleted) {
    throw new HTTPException(404, {
      message: "Module is not assigned to this task",
    });
  }

  return deleted;
}

export default unassignModuleFromTask;
