import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { publishEvent } from "../../events";
import { labelTable, taskLabelTable, taskTable } from "../../database/schema";
import { removeLabelFromGitHub } from "../../plugins/github/utils/sync-label-to-github";
import { removeLabelFromGitea } from "../../plugins/gitea/utils/sync-label-to-gitea";

async function unassignLabelFromTask(id: string, userId?: string) {
  const taskLabel = await db.query.taskLabelTable.findFirst({
    where: (taskLabel, { eq }) => eq(taskLabel.labelId, id),
  });

  if (!taskLabel) {
    throw new HTTPException(404, {
      message: "Label is not attached to any task",
    });
  }

  const label = await db.query.labelTable.findFirst({
    where: (label, { eq }) => eq(label.id, id),
  });

  if (!label) {
    throw new HTTPException(404, {
      message: "Label not found",
    });
  }

  const task = await db.query.taskTable.findFirst({
    where: (task, { eq }) => eq(task.id, taskLabel.taskId),
  });

  if (!task) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  await db
    .delete(taskLabelTable)
    .where(
      and(
        eq(taskLabelTable.taskId, taskLabel.taskId),
        eq(taskLabelTable.labelId, id),
      ),
    );

  removeLabelFromGitHub(taskLabel.taskId, label.name).catch((error) => {
    console.error("Failed to remove label from GitHub:", error);
  });

  removeLabelFromGitea(taskLabel.taskId, label.name).catch((error) => {
    console.error("Failed to remove label from Gitea:", error);
  });

  if (userId) {
    await publishEvent("task.label_removed", {
      taskId: task.id,
      projectId: task.projectId,
      userId,
      labelId: label.id,
      labelName: label.name,
      labelColor: label.color,
      type: "label_removed",
    });
  }

  return label;
}

export default unassignLabelFromTask;