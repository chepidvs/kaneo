import { eq, max } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function createModule({
  projectId,
  name,
  description,
  startDate,
  endDate,
}: {
  projectId: string;
  name: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}) {
  if (startDate && endDate && endDate < startDate) {
    throw new HTTPException(400, {
      message: "End date must not be earlier than start date",
    });
  }

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
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      position: (maxPositionResult?.maxPosition ?? 0) + 1,
    })
    .returning();

  if (!createdModule) {
    throw new HTTPException(500, { message: "Failed to create module" });
  }

  return createdModule;
}

export default createModule;
