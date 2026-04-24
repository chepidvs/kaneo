import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { labelTable } from "../../database/schema";

function normalizeLabelName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function createLabel(name: string, color: string, projectId: string) {
  const normalizedName = normalizeLabelName(name);

  if (!normalizedName) {
    throw new HTTPException(400, {
      message: "Label name is required",
    });
  }

  const existingLabel = await db.query.labelTable.findFirst({
    where: and(
      eq(labelTable.projectId, projectId),
      sql`lower(${labelTable.name}) = lower(${normalizedName})`,
    ),
  });

  if (existingLabel) {
    return existingLabel;
  }

  const [inserted] = await db
    .insert(labelTable)
    .values({
      name: normalizedName,
      color,
      projectId,
    })
    .returning();

  if (!inserted) {
    throw new HTTPException(500, {
      message: "Failed to create label",
    });
  }

  return inserted;
}

export default createLabel;
