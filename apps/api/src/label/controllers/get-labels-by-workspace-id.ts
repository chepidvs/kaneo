import { eq } from "drizzle-orm";
import db from "../../database";
import { labelTable } from "../../database/schema";

async function getLabelsByProjectId(projectId: string) {
  const labels = await db
    .select()
    .from(labelTable)
    .where(eq(labelTable.projectId, projectId));

  return labels;
}

export default getLabelsByProjectId;