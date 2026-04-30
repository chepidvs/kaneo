import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function getModules(projectId: string) {
  return db
    .select()
    .from(moduleTable)
    .where(eq(moduleTable.projectId, projectId))
    .orderBy(asc(moduleTable.position));
}

export default getModules;
