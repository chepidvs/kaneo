import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskModuleTable } from "../../database/schema";

async function assignModuleToTask(moduleId: string, taskId: string) {
  const module = await db.query.moduleTable.findFirst({
    where: (m, { eq }) => eq(m.id, moduleId),
  });

  if (!module) {
    throw new HTTPException(404, { message: "Module not found" });
  }

  const task = await db.query.taskTable.findFirst({
    where: (t, { eq }) => eq(t.id, taskId),
  });

  if (!task) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  if (module.projectId !== task.projectId) {
    throw new HTTPException(400, {
      message: "Module and task must belong to the same project",
    });
  }

  const [attached] = await db
    .insert(taskModuleTable)
    .values({ taskId, moduleId })
    .onConflictDoNothing({
      target: [taskModuleTable.taskId, taskModuleTable.moduleId],
    })
    .returning();

  const taskModule =
    attached ??
    (await db.query.taskModuleTable.findFirst({
      where: and(
        eq(taskModuleTable.taskId, taskId),
        eq(taskModuleTable.moduleId, moduleId),
      ),
    }));

  if (!taskModule) {
    throw new HTTPException(500, {
      message: "Failed to assign module to task",
    });
  }

  return module;
}

export default assignModuleToTask;
