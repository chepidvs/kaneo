import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

async function getPage(id: string) {
  const [page] = await db
    .select()
    .from(pageTable)
    .where(eq(pageTable.id, id))
    .limit(1);

  if (!page) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  return page;
}

export default getPage;
