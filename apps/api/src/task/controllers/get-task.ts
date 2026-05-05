import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  moduleTable,
  taskModuleTable,
  taskTable,
  userTable,
} from "../../database/schema";

async function getTask(taskId: string) {
  const task = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      number: taskTable.number,
      description: taskTable.description,
      status: taskTable.status,
      priority: taskTable.priority,
      startDate: taskTable.startDate,
      dueDate: taskTable.dueDate,
      position: taskTable.position,
      createdAt: taskTable.createdAt,
      userId: taskTable.userId,
      assigneeName: userTable.name,
      assigneeId: userTable.id,
      projectId: taskTable.projectId,
    })
    .from(taskTable)
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(eq(taskTable.id, taskId))
    .limit(1);

  if (!task.length || !task[0]) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const modulesData = await db
    .select({ id: moduleTable.id, name: moduleTable.name })
    .from(taskModuleTable)
    .innerJoin(moduleTable, eq(taskModuleTable.moduleId, moduleTable.id))
    .where(eq(taskModuleTable.taskId, taskId));

  return { ...task[0], modules: modulesData };
}

export default getTask;
