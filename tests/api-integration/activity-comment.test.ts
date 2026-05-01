import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

async function addWorkspaceUser(workspaceId: string, role = "member") {
  const userId = `user-${randomUUID()}`;

  const [user] = await db
    .insert(schema.userTable)
    .values({
      id: userId,
      email: `${userId}@example.com`,
      emailVerified: true,
      name: `Integration ${role}`,
    })
    .returning();

  await db.insert(schema.workspaceUserTable).values({
    workspaceId,
    userId: user.id,
    role,
    joinedAt: new Date(),
  });

  return user;
}

async function seedComment({
  authorId,
  projectId,
  columnId,
}: {
  authorId: string;
  projectId: string;
  columnId: string;
}) {
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      userId: authorId,
      title: "Comment permission task",
      description: "Task with comments",
      status: "to-do",
      columnId,
      priority: "medium",
      number: Math.floor(Math.random() * 100_000) + 1,
      position: 1,
    })
    .returning();

  const [comment] = await db
    .insert(schema.activityTable)
    .values({
      taskId: task.id,
      type: "comment",
      userId: authorId,
      content: "Permission-sensitive comment",
    })
    .returning();

  return comment;
}

describe("API integration: activity comment deletion", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("allows the original author to delete their own comment", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    const { project, columns } = await createProjectFixture({
      workspaceId: owner.workspace.id,
    });
    const author = await addWorkspaceUser(owner.workspace.id);
    const comment = await seedComment({
      authorId: author.id,
      projectId: project.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(author);
    const { app } = createApp();

    const response = await app.request("/api/activity/comment", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activityId: comment.id }),
    });

    expect(response.status).toBe(200);
    const remaining = await db
      .select()
      .from(schema.activityTable)
      .where(eq(schema.activityTable.id, comment.id));
    expect(remaining).toHaveLength(0);
  });

  it("allows a workspace owner to delete another user's comment", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    const { project, columns } = await createProjectFixture({
      workspaceId: owner.workspace.id,
    });
    const author = await addWorkspaceUser(owner.workspace.id);
    const comment = await seedComment({
      authorId: author.id,
      projectId: project.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(owner.user);
    const { app } = createApp();

    const response = await app.request("/api/activity/comment", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activityId: comment.id }),
    });

    expect(response.status).toBe(200);
    const remaining = await db
      .select()
      .from(schema.activityTable)
      .where(eq(schema.activityTable.id, comment.id));
    expect(remaining).toHaveLength(0);
  });

  it.each([
    "admin",
    "member",
  ])("rejects %s deleting another user's comment", async (role) => {
    const owner = await createWorkspaceMember({ role: "owner" });
    const { project, columns } = await createProjectFixture({
      workspaceId: owner.workspace.id,
    });
    const author = await addWorkspaceUser(owner.workspace.id);
    const actor = await addWorkspaceUser(owner.workspace.id, role);
    const comment = await seedComment({
      authorId: author.id,
      projectId: project.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(actor);
    const { app } = createApp();

    const response = await app.request("/api/activity/comment", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activityId: comment.id }),
    });

    expect(response.status).toBe(403);
    const remaining = await db
      .select()
      .from(schema.activityTable)
      .where(eq(schema.activityTable.id, comment.id));
    expect(remaining).toHaveLength(1);
  });
});
