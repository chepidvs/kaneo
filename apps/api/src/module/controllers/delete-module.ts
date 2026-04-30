import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function deleteModule(id: string) {
  const [deletedModule] = await db
    .delete(moduleTable)
    .where(eq(moduleTable.id, id))
    .returning();

  if (!deletedModule) {
    throw new HTTPException(404, { message: "Module not found" });
  }

  return deletedModule;
}

export default deleteModule;
