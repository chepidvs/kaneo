import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

async function getPublicPage(id: string) {
  const [page] = await db
    .select()
    .from(pageTable)
    .where(and(eq(pageTable.id, id), eq(pageTable.isPublic, true)))
    .limit(1);

  if (!page) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  return page;
}

export default getPublicPage;
