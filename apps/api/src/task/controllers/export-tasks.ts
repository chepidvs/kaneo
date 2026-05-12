import { eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  projectTable,
  taskAssigneeTable,
  taskTable,
  userTable,
} from "../../database/schema";

async function exportTasks(projectId: string) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, projectId),
  });

  if (!project) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  const tasks = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      number: taskTable.number,
      description: taskTable.description,
      status: taskTable.status,
      priority: taskTable.priority,
      dueDate: taskTable.dueDate,
      position: taskTable.position,
      createdAt: taskTable.createdAt,
    })
    .from(taskTable)
    .where(eq(taskTable.projectId, projectId))
    .orderBy(taskTable.position);

  const taskIds = tasks.map((t) => t.id);

  const assigneesData =
    taskIds.length > 0
      ? await db
          .select({
            taskId: taskAssigneeTable.taskId,
            userId: userTable.id,
            name: userTable.name,
          })
          .from(taskAssigneeTable)
          .innerJoin(userTable, eq(taskAssigneeTable.userId, userTable.id))
          .where(inArray(taskAssigneeTable.taskId, taskIds))
      : [];

  const taskAssigneesMap = new Map<
    string,
    Array<{ userId: string; name: string }>
  >();

  for (const a of assigneesData) {
    if (!taskAssigneesMap.has(a.taskId)) {
      taskAssigneesMap.set(a.taskId, []);
    }
    taskAssigneesMap.get(a.taskId)?.push({
      userId: a.userId,
      name: a.name,
    });
  }

  return {
    project: {
      name: project.name,
      slug: project.slug,
      description: project.description,
      exportedAt: new Date().toISOString(),
    },
    tasks: tasks.map((task) => {
      const assignees = taskAssigneesMap.get(task.id) || [];
      return {
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority || "low",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        userId: assignees[0]?.userId || null,
        assignees: assignees.map((a) => ({
          userId: a.userId,
          name: a.name,
        })),
      };
    }),
  };
}

export default exportTasks;
