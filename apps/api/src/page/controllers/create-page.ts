import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createPage({
  projectId,
  title,
  slug,
  content,
  isPublic,
  createdBy,
}: {
  projectId: string;
  title: string;
  slug?: string;
  content?: string;
  isPublic?: boolean;
  createdBy?: string;
}) {
  const resolvedSlug = slug ? toSlug(slug) : toSlug(title);

  if (!resolvedSlug) {
    throw new HTTPException(400, {
      message: "Page title must contain at least one alphanumeric character",
    });
  }

  const existing = await db
    .select({ id: pageTable.id })
    .from(pageTable)
    .where(
      and(eq(pageTable.projectId, projectId), eq(pageTable.slug, resolvedSlug)),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new HTTPException(409, {
      message: `Page with slug "${resolvedSlug}" already exists in this project`,
    });
  }

  const [createdPage] = await db
    .insert(pageTable)
    .values({
      projectId,
      title,
      slug: resolvedSlug,
      content: content || "",
      isPublic: isPublic ?? false,
      createdBy: createdBy || null,
    })
    .returning();

  if (!createdPage) {
    throw new HTTPException(500, { message: "Failed to create page" });
  }

  return createdPage;
}

export default createPage;
