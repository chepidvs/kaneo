import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

function toSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function updatePage(
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    isPublic?: boolean;
  },
) {
  const nextData = {
    ...data,
    slug: data.slug ? toSlug(data.slug) : undefined,
  };

  if (data.slug && !nextData.slug) {
    throw new HTTPException(400, {
      message: "Page slug must contain at least one alphanumeric character",
    });
  }

  const [updatedPage] = await db
    .update(pageTable)
    .set(nextData)
    .where(eq(pageTable.id, id))
    .returning();

  if (!updatedPage) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  return updatedPage;
}

export default updatePage;
