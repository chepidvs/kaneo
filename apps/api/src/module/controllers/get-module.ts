import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function getModule(id: string) {
  const [moduleData] = await db
    .select()
    .from(moduleTable)
    .where(eq(moduleTable.id, id))
    .limit(1);

  if (!moduleData) {
    throw new HTTPException(404, { message: "Module not found" });
  }

  return moduleData;
}

export default getModule;
