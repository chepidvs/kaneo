import { eq, inArray, or } from "drizzle-orm";
import db from "../../database";
import {
  taskAssigneeTable,
  taskRelationTable,
  taskTable,
  userTable,
} from "../../database/schema";

async function getTaskRelations(taskId: string) {
  const relations = await db
    .select({
      id: taskRelationTable.id,
      sourceTaskId: taskRelationTable.sourceTaskId,
      targetTaskId: taskRelationTable.targetTaskId,
      relationType: taskRelationTable.relationType,
      createdAt: taskRelationTable.createdAt,
    })
    .from(taskRelationTable)
    .where(
      or(
        eq(taskRelationTable.sourceTaskId, taskId),
        eq(taskRelationTable.targetTaskId, taskId),
      ),
    );

  const taskIds = new Set<string>();
  for (const rel of relations) {
    taskIds.add(rel.sourceTaskId);
    taskIds.add(rel.targetTaskId);
  }

  const tasks = new Map<
    string,
    {
      id: string;
      title: string;
      status: string;
      priority: string | null;
      number: number | null;
      projectId: string;
      userId: string | null;
      assigneeName: string | null;
      assignees: { id: string; name: string | null; image: string | null }[];
    }
  >();

  if (taskIds.size > 0) {
    const taskIdsArr = [...taskIds];

    const [taskRows, assigneeRows] = await Promise.all([
      db
        .select({
          id: taskTable.id,
          title: taskTable.title,
          status: taskTable.status,
          priority: taskTable.priority,
          number: taskTable.number,
          projectId: taskTable.projectId,
          userId: taskTable.userId,
          assigneeName: userTable.name,
        })
        .from(taskTable)
        .leftJoin(userTable, eq(taskTable.userId, userTable.id))
        .where(inArray(taskTable.id, taskIdsArr)),
      db
        .select({
          taskId: taskAssigneeTable.taskId,
          userId: userTable.id,
          name: userTable.name,
          image: userTable.image,
        })
        .from(taskAssigneeTable)
        .innerJoin(userTable, eq(taskAssigneeTable.userId, userTable.id))
        .where(inArray(taskAssigneeTable.taskId, taskIdsArr)),
    ]);

    const assigneesMap = new Map<
      string,
      { id: string; name: string | null; image: string | null }[]
    >();
    for (const row of assigneeRows) {
      const list = assigneesMap.get(row.taskId) ?? [];
      list.push({ id: row.userId, name: row.name, image: row.image });
      assigneesMap.set(row.taskId, list);
    }

    for (const task of taskRows) {
      tasks.set(task.id, {
        ...task,
        assignees: assigneesMap.get(task.id) ?? [],
      });
    }
  }

  return relations.map((rel) => ({
    ...rel,
    sourceTask: tasks.get(rel.sourceTaskId) ?? null,
    targetTask: tasks.get(rel.targetTaskId) ?? null,
  }));
}

export default getTaskRelations;
