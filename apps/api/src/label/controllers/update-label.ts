import { and, eq, ne, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { labelTable } from "../../database/schema";

function normalizeLabelName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function updateLabel(id: string, name: string, color: string) {
  const normalizedName = normalizeLabelName(name);

  if (!normalizedName) {
    throw new HTTPException(400, {
      message: "Label name is required",
    });
  }

  const label = await db.query.labelTable.findFirst({
    where: (label, { eq }) => eq(label.id, id),
  });

  if (!label) {
    throw new HTTPException(404, {
      message: "Label not found",
    });
  }

  const conflictingLabel = await db.query.labelTable.findFirst({
    where: and(
      eq(labelTable.projectId, label.projectId),
      ne(labelTable.id, id),
      sql`lower(${labelTable.name}) = lower(${normalizedName})`,
    ),
  });

  if (conflictingLabel) {
    throw new HTTPException(409, {
      message: "A label with this name already exists in the project",
    });
  }

  const [updatedLabel] = await db
    .update(labelTable)
    .set({ name: normalizedName, color })
    .where(eq(labelTable.id, id))
    .returning();

  if (!updatedLabel) {
    throw new HTTPException(500, {
      message: "Failed to update label",
    });
  }

  return updatedLabel;
}

export default updateLabel;
