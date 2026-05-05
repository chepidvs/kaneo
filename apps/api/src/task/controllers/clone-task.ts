import { and, eq, max } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  taskLabelTable,
  taskModuleTable,
  taskTable,
} from "../../database/schema";
import getNextTaskNumber from "./get-next-task-number";

async function cloneTask(id: string, clonedBy?: string) {
  const original = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!original) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  const nextTaskNumber = await getNextTaskNumber(original.projectId);

  const [maxPositionResult] = await db
    .select({ maxPosition: max(taskTable.position) })
    .from(taskTable)
    .where(
      and(
        eq(taskTable.projectId, original.projectId),
        original.columnId
          ? eq(taskTable.columnId, original.columnId)
          : eq(taskTable.status, original.status),
      ),
    );

  const nextPosition = (maxPositionResult?.maxPosition ?? 0) + 1;

  const [clonedTask] = await db
    .insert(taskTable)
    .values({
      projectId: original.projectId,
      userId: original.userId,
      createdBy: clonedBy || null,
      title: `Copy of ${original.title}`,
      status: original.status,
      columnId: original.columnId,
      startDate: original.startDate,
      dueDate: original.dueDate,
      description: original.description,
      priority: original.priority,
      number: nextTaskNumber + 1,
      position: nextPosition,
    })
    .returning();

  if (!clonedTask) {
    throw new HTTPException(500, { message: "Failed to clone task" });
  }

  const originalLabels = await db.query.taskLabelTable.findMany({
    where: eq(taskLabelTable.taskId, id),
  });

  if (originalLabels.length > 0) {
    await db.insert(taskLabelTable).values(
      originalLabels.map((tl) => ({
        taskId: clonedTask.id,
        labelId: tl.labelId,
      })),
    );
  }

  const originalModules = await db.query.taskModuleTable.findMany({
    where: eq(taskModuleTable.taskId, id),
  });

  if (originalModules.length > 0) {
    await db.insert(taskModuleTable).values(
      originalModules.map((tm) => ({
        taskId: clonedTask.id,
        moduleId: tm.moduleId,
      })),
    );
  }

  return clonedTask;
}

export default cloneTask;
