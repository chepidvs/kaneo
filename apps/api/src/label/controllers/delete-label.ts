import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { labelTable, taskLabelTable } from "../../database/schema";
import { removeLabelFromGitea } from "../../plugins/gitea/utils/sync-label-to-gitea";
import { removeLabelFromGitHub } from "../../plugins/github/utils/sync-label-to-github";

async function deleteLabel(id: string) {
  const label = await db.query.labelTable.findFirst({
    where: (label, { eq }) => eq(label.id, id),
  });

  if (!label) {
    throw new HTTPException(404, {
      message: "Label not found",
    });
  }

  const attachedTasks = await db.query.taskLabelTable.findMany({
    where: (taskLabel, { eq }) => eq(taskLabel.labelId, id),
  });

  for (const taskLabel of attachedTasks) {
    removeLabelFromGitHub(taskLabel.taskId, label.name).catch((error) => {
      console.error("Failed to remove label from GitHub:", error);
    });

    removeLabelFromGitea(taskLabel.taskId, label.name).catch((error) => {
      console.error("Failed to remove label from Gitea:", error);
    });
  }

  await db.delete(taskLabelTable).where(eq(taskLabelTable.labelId, id));

  const [deletedLabel] = await db
    .delete(labelTable)
    .where(eq(labelTable.id, id))
    .returning();

  if (!deletedLabel) {
    throw new HTTPException(500, {
      message: "Failed to delete label",
    });
  }

  return deletedLabel;
}

export default deleteLabel;
