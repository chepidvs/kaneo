import {
  and,
  asc,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import db from "../../database";
import {
  labelTable,
  projectTable,
  taskAssigneeTable,
  taskLabelTable,
  taskTable,
  userTable,
} from "../../database/schema";
import { canAccessProject } from "../../utils/permissions/project-access";

type GetWorkspaceTasksOptions = {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "dueDate" | "priority" | "title" | "number";
  sortOrder?: "asc" | "desc";
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
};

const priorityCaseExpr = sql<number>`CASE
  WHEN ${taskTable.priority} = 'urgent' THEN 4
  WHEN ${taskTable.priority} = 'high' THEN 3
  WHEN ${taskTable.priority} = 'medium' THEN 2
  WHEN ${taskTable.priority} = 'low' THEN 1
  ELSE 0
END`;

function buildOrderBy(
  sortBy: GetWorkspaceTasksOptions["sortBy"],
  sortOrder: GetWorkspaceTasksOptions["sortOrder"],
): SQL {
  const direction = sortOrder === "asc" ? asc : desc;
  switch (sortBy) {
    case "dueDate":
      return direction(taskTable.dueDate);
    case "priority":
      return direction(priorityCaseExpr);
    case "title":
      return direction(taskTable.title);
    case "number":
      return direction(taskTable.number);
    default:
      return direction(taskTable.createdAt);
  }
}

async function getWorkspaceTasks(
  workspaceId: string,
  userId: string,
  options: GetWorkspaceTasksOptions = {},
) {
  // 1. Get all non-archived projects in workspace
  const projects = await db
    .select({
      id: projectTable.id,
      slug: projectTable.slug,
      name: projectTable.name,
      isPublic: projectTable.isPublic,
    })
    .from(projectTable)
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
      ),
    );

  // 2. Filter by access
  const accessibleProjectIds: string[] = [];
  const projectMap = new Map<string, { slug: string; name: string }>();

  for (const project of projects) {
    const allowed = await canAccessProject({
      userId,
      workspaceId,
      projectId: project.id,
      isPublic: project.isPublic,
    });
    if (allowed) {
      accessibleProjectIds.push(project.id);
      projectMap.set(project.id, {
        slug: project.slug,
        name: project.name,
      });
    }
  }

  if (accessibleProjectIds.length === 0) {
    return {
      data: [],
      pagination: { total: 0, page: 1, pageSize: 50, totalPages: 0 },
    };
  }

  // 3. Build conditions
  const conditions: SQL[] = [
    inArray(taskTable.projectId, accessibleProjectIds),
  ];

  if (options.status && options.status.length > 0) {
    conditions.push(inArray(taskTable.status, options.status));
  }

  if (options.priority && options.priority.length > 0) {
    conditions.push(inArray(taskTable.priority, options.priority));
  }

  if (options.assigneeId && options.assigneeId.length > 0) {
    const assigneeIds = options.assigneeId;
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(taskAssigneeTable)
          .where(
            and(
              eq(taskAssigneeTable.taskId, taskTable.id),
              inArray(taskAssigneeTable.userId, assigneeIds),
            ),
          ),
      ),
    );
  }

  const whereClause = and(...conditions);

  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize =
    options.limit && options.limit > 0 ? Math.min(options.limit, 200) : 50;
  const offset = (page - 1) * pageSize;

  const orderByClause = buildOrderBy(
    options.sortBy ?? "createdAt",
    options.sortOrder ?? "desc",
  );

  // 4. Count
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskTable)
    .where(whereClause);
  const total = Number(countRow?.count ?? 0);

  // 5. Fetch tasks
  const tasks = await db
    .select({
      id: taskTable.id,
      number: taskTable.number,
      title: taskTable.title,
      status: taskTable.status,
      priority: taskTable.priority,
      projectId: taskTable.projectId,
      dueDate: taskTable.dueDate,
      startDate: taskTable.startDate,
      createdAt: taskTable.createdAt,
    })
    .from(taskTable)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(pageSize)
    .offset(offset);

  if (tasks.length === 0) {
    return {
      data: [],
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(0, Math.ceil(total / pageSize)),
      },
    };
  }

  const taskIds = tasks.map((t) => t.id);

  // 6. Fetch assignees
  const assigneesData = await db
    .select({
      taskId: taskAssigneeTable.taskId,
      id: userTable.id,
      name: userTable.name,
      image: userTable.image,
      username: userTable.username,
    })
    .from(taskAssigneeTable)
    .innerJoin(userTable, eq(taskAssigneeTable.userId, userTable.id))
    .where(inArray(taskAssigneeTable.taskId, taskIds));

  // 7. Fetch labels
  const labelsData = await db
    .select({
      taskId: taskLabelTable.taskId,
      id: labelTable.id,
      name: labelTable.name,
      color: labelTable.color,
    })
    .from(taskLabelTable)
    .innerJoin(labelTable, eq(taskLabelTable.labelId, labelTable.id))
    .where(inArray(taskLabelTable.taskId, taskIds));

  // 8. Build maps
  const assigneesMap = new Map<
    string,
    Array<{
      id: string;
      name: string;
      image: string | null;
      username: string | null;
    }>
  >();
  for (const a of assigneesData) {
    if (!assigneesMap.has(a.taskId)) assigneesMap.set(a.taskId, []);
    assigneesMap.get(a.taskId)?.push({
      id: a.id,
      name: a.name,
      image: a.image,
      username: a.username,
    });
  }

  const labelsMap = new Map<
    string,
    Array<{ id: string; name: string; color: string }>
  >();
  for (const l of labelsData) {
    if (!labelsMap.has(l.taskId)) labelsMap.set(l.taskId, []);
    labelsMap.get(l.taskId)?.push({ id: l.id, name: l.name, color: l.color });
  }

  // 9. Enrich
  const data = tasks.map((task) => {
    const proj = projectMap.get(task.projectId);
    return {
      id: task.id,
      number: task.number,
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      projectSlug: proj?.slug ?? "",
      projectName: proj?.name ?? "",
      dueDate: task.dueDate,
      startDate: task.startDate,
      createdAt: task.createdAt,
      assignees: assigneesMap.get(task.id) ?? [],
      labels: labelsMap.get(task.id) ?? [],
    };
  });

  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export default getWorkspaceTasks;
