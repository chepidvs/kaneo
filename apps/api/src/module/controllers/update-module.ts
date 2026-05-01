import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { moduleTable } from "../../database/schema";

async function updateModule(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    position?: number;
  },
) {
  const [existingModule] = await db
    .select({
      startDate: moduleTable.startDate,
      endDate: moduleTable.endDate,
    })
    .from(moduleTable)
    .where(eq(moduleTable.id, id))
    .limit(1);

  if (!existingModule) {
    throw new HTTPException(404, { message: "Module not found" });
  }

  const nextStartDate =
    data.startDate !== undefined ? data.startDate : existingModule.startDate;
  const nextEndDate =
    data.endDate !== undefined ? data.endDate : existingModule.endDate;

  if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
    throw new HTTPException(400, {
      message: "End date must not be earlier than start date",
    });
  }

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
