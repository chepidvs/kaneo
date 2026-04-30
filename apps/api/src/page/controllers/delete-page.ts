import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

async function deletePage(id: string) {
  const [deletedPage] = await db
    .delete(pageTable)
    .where(eq(pageTable.id, id))
    .returning();

  if (!deletedPage) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  return deletedPage;
}

export default deletePage;
