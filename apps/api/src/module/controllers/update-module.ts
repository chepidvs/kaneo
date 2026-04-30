import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function updateModule(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    position?: number;
  },
) {
  const [updatedModule] = await db
    .update(moduleTable)
    .set(data)
    .where(eq(moduleTable.id, id))
    .returning();

  if (!updatedModule) {
    throw new HTTPException(404, { message: "Module not found" });
  }

  return updatedModule;
}

export default updateModule;
