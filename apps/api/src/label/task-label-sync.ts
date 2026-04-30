import { and, eq, inArray, notInArray } from "drizzle-orm";
import db from "../database";
import { labelTable, taskLabelTable, taskTable } from "../database/schema";

type LabelInput = {
  name: string;
  color: string;
};

export async function attachProjectLabelToTask({
  taskId,
  projectId,
  name,
  color,
}: {
  taskId: string;
  projectId: string;
  name: string;
  color: string;
}) {
  const [label] = await db
    .insert(labelTable)
    .values({ projectId, name, color })
    .onConflictDoUpdate({
      target: [labelTable.projectId, labelTable.name],
      set: { color },
    })
    .returning();

  if (!label) {
    return null;
  }

  await db
    .insert(taskLabelTable)
    .values({ taskId, labelId: label.id })
    .onConflictDoNothing({
      target: [taskLabelTable.taskId, taskLabelTable.labelId],
    });

  return label;
}

export async function getTaskLabels(taskId: string) {
  return db
    .select({
      id: labelTable.id,
      name: labelTable.name,
      color: labelTable.color,
      projectId: labelTable.projectId,
    })
    .from(taskLabelTable)
    .innerJoin(labelTable, eq(taskLabelTable.labelId, labelTable.id))
    .where(eq(taskLabelTable.taskId, taskId));
}

export async function removeTaskLabelByName(taskId: string, name: string) {
  const matchingLabels = await db
    .select({ id: labelTable.id })
    .from(taskLabelTable)
    .innerJoin(labelTable, eq(taskLabelTable.labelId, labelTable.id))
    .where(and(eq(taskLabelTable.taskId, taskId), eq(labelTable.name, name)));

  if (matchingLabels.length === 0) {
    return;
  }

  await db.delete(taskLabelTable).where(
    and(
      eq(taskLabelTable.taskId, taskId),
      inArray(
        taskLabelTable.labelId,
        matchingLabels.map((label) => label.id),
      ),
    ),
  );
}

export async function syncTaskLabelsByName({
  taskId,
  projectId,
  labels,
}: {
  taskId: string;
  projectId: string;
  labels: LabelInput[];
}) {
  const desiredNames = labels.map((label) => label.name);

  if (desiredNames.length > 0) {
    const labelsToDetach = await db
      .select({ id: labelTable.id })
      .from(taskLabelTable)
      .innerJoin(labelTable, eq(taskLabelTable.labelId, labelTable.id))
      .where(
        and(
          eq(taskLabelTable.taskId, taskId),
          notInArray(labelTable.name, desiredNames),
        ),
      );

    if (labelsToDetach.length > 0) {
      await db.delete(taskLabelTable).where(
        and(
          eq(taskLabelTable.taskId, taskId),
          inArray(
            taskLabelTable.labelId,
            labelsToDetach.map((label) => label.id),
          ),
        ),
      );
    }
  } else {
    await db.delete(taskLabelTable).where(eq(taskLabelTable.taskId, taskId));
  }

  for (const label of labels) {
    await attachProjectLabelToTask({
      taskId,
      projectId,
      name: label.name,
      color: label.color,
    });
  }
}

export async function getTaskProjectId(taskId: string) {
  const task = await db.query.taskTable.findFirst({
    columns: { projectId: true },
    where: eq(taskTable.id, taskId),
  });

  return task?.projectId ?? null;
}
