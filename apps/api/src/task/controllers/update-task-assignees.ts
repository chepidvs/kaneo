import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  projectTable,
  taskAssigneeTable,
  taskTable,
  userTable,
} from "../../database/schema";
import { publishEvent } from "../../events";

const MAX_ASSIGNEES = 5;

async function updateTaskAssignees({
  taskId,
  userIds,
  actorUserId,
}: {
  taskId: string;
  userIds: string[];
  actorUserId: string;
}) {
  if (userIds.length > MAX_ASSIGNEES) {
    throw new HTTPException(400, {
      message: `A task can have at most ${MAX_ASSIGNEES} assignees`,
    });
  }

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });

  if (!task) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, task.projectId),
  });

  const currentAssignees = await db
    .select({ userId: taskAssigneeTable.userId })
    .from(taskAssigneeTable)
    .where(eq(taskAssigneeTable.taskId, taskId));

  const currentIds = new Set(currentAssignees.map((a) => a.userId));
  const desiredIds = new Set(userIds);

  const toAdd = userIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

  if (toRemove.length > 0) {
    await db
      .delete(taskAssigneeTable)
      .where(
        and(
          eq(taskAssigneeTable.taskId, taskId),
          inArray(taskAssigneeTable.userId, toRemove),
        ),
      );
  }

  if (toAdd.length > 0) {
    await db
      .insert(taskAssigneeTable)
      .values(toAdd.map((userId) => ({ taskId, userId })))
      .onConflictDoNothing({
        target: [taskAssigneeTable.taskId, taskAssigneeTable.userId],
      });
  }

  const addedUsers =
    toAdd.length > 0
      ? await db
          .select({ id: userTable.id, name: userTable.name })
          .from(userTable)
          .where(inArray(userTable.id, toAdd))
      : [];

  const removedUsers =
    toRemove.length > 0
      ? await db
          .select({ id: userTable.id, name: userTable.name })
          .from(userTable)
          .where(inArray(userTable.id, toRemove))
      : [];

  for (const user of addedUsers) {
    await publishEvent("task.assignee_added", {
      taskId,
      workspaceId: project?.workspaceId,
      projectId: task.projectId,
      userId: actorUserId,
      assigneeId: user.id,
      assigneeName: user.name,
      title: task.title,
      type: "assignee_added",
    });
  }

  for (const user of removedUsers) {
    await publishEvent("task.assignee_removed", {
      taskId,
      workspaceId: project?.workspaceId,
      projectId: task.projectId,
      userId: actorUserId,
      assigneeId: user.id,
      assigneeName: user.name,
      title: task.title,
      type: "assignee_removed",
    });
  }

  if (userIds.length === 0 && currentIds.size > 0) {
    await publishEvent("task.unassigned", {
      taskId,
      userId: actorUserId,
      title: task.title,
      type: "unassigned",
    });
  }

  const finalAssignees = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      image: userTable.image,
    })
    .from(taskAssigneeTable)
    .innerJoin(userTable, eq(taskAssigneeTable.userId, userTable.id))
    .where(eq(taskAssigneeTable.taskId, taskId));

  return {
    ...task,
    assignees: finalAssignees,
    userId: finalAssignees[0]?.id ?? null,
    assigneeName: finalAssignees[0]?.name ?? null,
    assigneeId: finalAssignees[0]?.id ?? null,
  };
}

export default updateTaskAssignees;
