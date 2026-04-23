import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { publishEvent } from "../../events";
import { labelTable, taskLabelTable, taskTable } from "../../database/schema";
import { syncLabelToGitea } from "../../plugins/gitea/utils/sync-label-to-gitea";
import { syncLabelToGitHub } from "../../plugins/github/utils/sync-label-to-github";

async function assignLabelToTask(
  id: string,
  taskId: string,
  userId?: string,
) {
  const label = await db.query.labelTable.findFirst({
    where: (label, { eq }) => eq(label.id, id),
  });

  if (!label) {
    throw new HTTPException(404, {
      message: "Label not found",
    });
  }

  const task = await db.query.taskTable.findFirst({
    where: (task, { eq }) => eq(task.id, taskId),
  });

  if (!task) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  if (label.projectId !== task.projectId) {
    throw new HTTPException(400, {
      message: "Label and task must belong to the same project",
    });
  }

  const [attached] = await db
    .insert(taskLabelTable)
    .values({
      taskId,
      labelId: id,
    })
    .onConflictDoNothing({
      target: [taskLabelTable.taskId, taskLabelTable.labelId],
    })
    .returning();

  const taskLabel =
    attached ??
    (await db.query.taskLabelTable.findFirst({
      where: and(
        eq(taskLabelTable.taskId, taskId),
        eq(taskLabelTable.labelId, id),
      ),
    }));

  if (!taskLabel) {
    throw new HTTPException(500, {
      message: "Failed to attach label to task",
    });
  }

  syncLabelToGitHub(taskId, label.name, label.color).catch((error) => {
    console.error("Failed to sync label to GitHub:", error);
  });

  syncLabelToGitea(taskId, label.name, label.color).catch((error) => {
    console.error("Failed to sync label to Gitea:", error);
  });

  if (attached && userId) {
    await publishEvent("task.label_added", {
      taskId: task.id,
      projectId: task.projectId,
      userId,
      labelId: label.id,
      labelName: label.name,
      labelColor: label.color,
      type: "label_added",
    });
  }

  return label;
}

export default assignLabelToTask;