import { eq } from "drizzle-orm";
import db from "../../database";
import { labelTable, taskLabelTable } from "../../database/schema";

async function getLabelsByTaskId(taskId: string) {
  const labels = await db
    .select({
      id: labelTable.id,
      projectId: labelTable.projectId,
      name: labelTable.name,
      color: labelTable.color,
      createdAt: labelTable.createdAt,
      updatedAt: labelTable.updatedAt,
    })
    .from(taskLabelTable)
    .innerJoin(labelTable, eq(taskLabelTable.labelId, labelTable.id))
    .where(eq(taskLabelTable.taskId, taskId));

  return labels;
}

export default getLabelsByTaskId;