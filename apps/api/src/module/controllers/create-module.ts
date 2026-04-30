import { eq, max } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function createModule({
  projectId,
  name,
  description,
}: {
  projectId: string;
  name: string;
  description?: string;
}) {
  const [maxPositionResult] = await db
    .select({ maxPosition: max(moduleTable.position) })
    .from(moduleTable)
    .where(eq(moduleTable.projectId, projectId));

  const [createdModule] = await db
    .insert(moduleTable)
    .values({
      projectId,
      name,
      description: description || null,
      position: (maxPositionResult?.maxPosition ?? 0) + 1,
    })
    .returning();

  if (!createdModule) {
    throw new HTTPException(500, { message: "Failed to create module" });
  }

  return createdModule;
}

export default createModule;
