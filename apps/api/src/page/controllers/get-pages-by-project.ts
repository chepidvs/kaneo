import { desc, eq } from "drizzle-orm";
import db from "../../database";
import { pageTable } from "../../database/schema";

async function getPagesByProject(projectId: string) {
  return db
    .select()
    .from(pageTable)
    .where(eq(pageTable.projectId, projectId))
    .orderBy(desc(pageTable.updatedAt));
}

export default getPagesByProject;
