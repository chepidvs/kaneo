import { aliasedTable, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  moduleTable,
  taskAssigneeTable,
  taskModuleTable,
  taskTable,
  userTable,
} from "../../database/schema";

const creatorTable = aliasedTable(userTable, "creator");

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
      updatedAt: taskTable.updatedAt,
      projectId: taskTable.projectId,
      createdByName: creatorTable.name,
    })
    .from(taskTable)
    .leftJoin(creatorTable, eq(taskTable.createdBy, creatorTable.id))
    .where(eq(taskTable.id, taskId))
    .limit(1);

  if (!task.length || !task[0]) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const [modulesData, assigneesData] = await Promise.all([
    db
      .select({ id: moduleTable.id, name: moduleTable.name })
      .from(taskModuleTable)
      .innerJoin(moduleTable, eq(taskModuleTable.moduleId, moduleTable.id))
      .where(eq(taskModuleTable.taskId, taskId)),
    db
      .select({
        id: userTable.id,
        name: userTable.name,
        image: userTable.image,
      })
      .from(taskAssigneeTable)
      .innerJoin(userTable, eq(taskAssigneeTable.userId, userTable.id))
      .where(eq(taskAssigneeTable.taskId, taskId)),
  ]);

  return {
    ...task[0],
    assignees: assigneesData,
    userId: assigneesData[0]?.id ?? null,
    assigneeName: assigneesData[0]?.name ?? null,
    assigneeId: assigneesData[0]?.id ?? null,
    modules: modulesData,
  };
}

export default getTask;
