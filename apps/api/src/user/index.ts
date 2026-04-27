import { eq } from "drizzle-orm";
import { Hono } from "hono";
import db from "../database";
import { userTable } from "../database/schema";

const user = new Hono<{
  Variables: {
    userId: string;
  };
}>();

user.get("/me", async (c) => {
  const userId = c.get("userId");

  const [currentUser] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      username: userTable.username,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(currentUser);
});

user.put("/username", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const username = String(body.username || "")
    .toLowerCase()
    .trim();

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return c.json(
      {
        error:
          "Username must be 3-30 characters and only use lowercase letters, numbers, and underscore",
      },
      400,
    );
  }

  await db.update(userTable).set({ username }).where(eq(userTable.id, userId));

  return c.json({ success: true, username });
});

export default user;
