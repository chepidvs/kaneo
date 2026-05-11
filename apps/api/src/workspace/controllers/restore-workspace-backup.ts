import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../database";
import {
  parseWorkspaceBackup,
  validateWorkspaceBackupStructure,
  type WorkspaceBackupRolePermissions,
} from "../backup-schema";

const LOCKED_OFF: Record<string, string[]> = {
  workspace: ["delete"],
  team: ["manage_roles"],
};

const LOCKED_ON: Record<string, string[]> = {
  workspace: ["read"],
  project: ["read"],
  task: ["read"],
};

function parseDate(value: string | null | undefined, fallback = new Date()) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function sanitizeRolePermissions(
  permissions: WorkspaceBackupRolePermissions,
): WorkspaceBackupRolePermissions {
  const result: WorkspaceBackupRolePermissions = {};

  for (const [resource, actions] of Object.entries(permissions)) {
    let filtered = [...actions];

    if (LOCKED_OFF[resource]) {
      filtered = filtered.filter(
        (action) => !LOCKED_OFF[resource].includes(action),
      );
    }

    result[resource] = filtered;
  }

  for (const [resource, actions] of Object.entries(LOCKED_ON)) {
    if (!result[resource]) {
      result[resource] = [...actions];
      continue;
    }

    for (const action of actions) {
      if (!result[resource].includes(action)) {
        result[resource].push(action);
      }
    }
  }

  return result;
}

async function restoreWorkspaceBackup(
  workspaceId: string,
  actorUserId: string,
  input: unknown,
) {
  const backup = parseWorkspaceBackup(input);
  const validation = validateWorkspaceBackupStructure(backup);

  if (validation.errors.length > 0) {
    throw new HTTPException(400, {
      message: validation.errors[0] ?? "Backup validation failed",
    });
  }

  const workspace = await db.query.workspaceTable.findFirst({
    where: eq(schema.workspaceTable.id, workspaceId),
  });

  if (!workspace) {
    throw new HTTPException(404, {
      message: "Target workspace not found",
    });
  }

  const [projectCount, rolePermissionCount, existingWorkspaceMembers] =
    await Promise.all([
      db
        .select({ id: schema.projectTable.id })
        .from(schema.projectTable)
        .where(eq(schema.projectTable.workspaceId, workspaceId))
        .limit(1),
      db
        .select({ id: schema.workspaceRolePermissionsTable.id })
        .from(schema.workspaceRolePermissionsTable)
        .where(
          eq(schema.workspaceRolePermissionsTable.workspaceId, workspaceId),
        )
        .limit(1),
      db
        .select({
          id: schema.workspaceUserTable.id,
          userId: schema.workspaceUserTable.userId,
        })
        .from(schema.workspaceUserTable)
        .where(eq(schema.workspaceUserTable.workspaceId, workspaceId)),
    ]);

  if (projectCount.length > 0 || rolePermissionCount.length > 0) {
    throw new HTTPException(400, {
      message: "Target workspace must be empty before restore",
    });
  }

  if (
    existingWorkspaceMembers.length > 1 ||
    (existingWorkspaceMembers.length === 1 &&
      existingWorkspaceMembers[0]?.userId !== actorUserId)
  ) {
    throw new HTTPException(400, {
      message: "Target workspace must be empty before restore",
    });
  }

  const emails = Array.from(
    new Set(
      [
        ...backup.members.map((member) => member.email.trim().toLowerCase()),
        ...backup.projects.flatMap((project) =>
          project.members.map((member) => member.email.trim().toLowerCase()),
        ),
      ].filter(Boolean),
    ),
  );

  const users =
    emails.length > 0
      ? await db
          .select({
            id: schema.userTable.id,
            email: schema.userTable.email,
          })
          .from(schema.userTable)
          .where(inArray(schema.userTable.email, emails))
      : [];

  const emailToUserId = new Map(
    users.map((user) => [user.email.trim().toLowerCase(), user.id]),
  );

  const sourceUserIdToTargetUserId = new Map<string, string>();
  for (const member of backup.members) {
    const targetUserId = emailToUserId.get(member.email.trim().toLowerCase());
    if (targetUserId) {
      sourceUserIdToTargetUserId.set(member.id, targetUserId);
    }
  }

  for (const project of backup.projects) {
    for (const member of project.members) {
      const targetUserId = emailToUserId.get(member.email.trim().toLowerCase());
      if (targetUserId) {
        sourceUserIdToTargetUserId.set(member.id, targetUserId);
      }
    }
  }

  return db.transaction(async (tx) => {
    const existingWorkspaceUserIds = new Set(
      existingWorkspaceMembers.map((member) => member.userId),
    );

    for (const [role, permissions] of Object.entries(backup.rolePermissions)) {
      await tx.insert(schema.workspaceRolePermissionsTable).values({
        id: createId(),
        workspaceId,
        role,
        permissions: sanitizeRolePermissions(permissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    for (const member of backup.members) {
      const targetUserId = sourceUserIdToTargetUserId.get(member.id);
      if (!targetUserId || existingWorkspaceUserIds.has(targetUserId)) {
        continue;
      }

      await tx.insert(schema.workspaceUserTable).values({
        id: createId(),
        workspaceId,
        userId: targetUserId,
        role: member.role || "member",
        joinedAt: parseDate(member.joinedAt),
      });

      existingWorkspaceUserIds.add(targetUserId);
    }

    const columnIdMap = new Map<string, string>();
    const labelIdMap = new Map<string, string>();
    const moduleIdMap = new Map<string, string>();
    const taskIdMap = new Map<string, string>();

    let restoredProjectMembers = 0;
    let restoredComments = 0;
    let restoredTimeEntries = 0;
    let skippedAssets = 0;

    for (const projectSnapshot of backup.projects) {
      const sourceProject = projectSnapshot.project;
      const targetProjectId = createId();

      await tx.insert(schema.projectTable).values({
        id: targetProjectId,
        workspaceId,
        slug: sourceProject.slug,
        icon: sourceProject.icon || "Layout",
        name: sourceProject.name,
        description: sourceProject.description,
        createdAt: parseDate(sourceProject.createdAt),
        isPublic: sourceProject.isPublic ?? false,
        archivedAt: sourceProject.archivedAt
          ? parseDate(sourceProject.archivedAt)
          : null,
      });

      const projectMemberUserIds = new Set<string>();
      for (const member of projectSnapshot.members) {
        const targetUserId = sourceUserIdToTargetUserId.get(member.id);
        if (!targetUserId || !existingWorkspaceUserIds.has(targetUserId)) {
          continue;
        }

        if (projectMemberUserIds.has(targetUserId)) {
          continue;
        }

        await tx.insert(schema.projectMemberTable).values({
          id: createId(),
          workspaceId,
          projectId: targetProjectId,
          userId: targetUserId,
          role: member.role || "member",
          createdAt: parseDate(member.createdAt),
        });

        projectMemberUserIds.add(targetUserId);
        restoredProjectMembers += 1;
      }

      for (const column of projectSnapshot.columns) {
        const targetColumnId = createId();
        columnIdMap.set(column.id, targetColumnId);

        await tx.insert(schema.columnTable).values({
          id: targetColumnId,
          projectId: targetProjectId,
          name: column.name,
          slug: column.slug,
          position: column.position,
          icon: column.icon,
          color: column.color,
          isFinal: column.isFinal,
          createdAt: parseDate(column.createdAt),
          updatedAt: parseDate(column.updatedAt, parseDate(column.createdAt)),
        });
      }

      for (const label of projectSnapshot.labels) {
        const targetLabelId = createId();
        labelIdMap.set(label.id, targetLabelId);

        await tx.insert(schema.labelTable).values({
          id: targetLabelId,
          projectId: targetProjectId,
          name: label.name,
          color: label.color,
          createdAt: parseDate(label.createdAt),
          updatedAt: parseDate(label.updatedAt, parseDate(label.createdAt)),
        });
      }

      for (const module of projectSnapshot.modules) {
        const targetModuleId = createId();
        moduleIdMap.set(module.id, targetModuleId);

        await tx.insert(schema.moduleTable).values({
          id: targetModuleId,
          projectId: targetProjectId,
          name: module.name,
          description: module.description,
          startDate: module.startDate ? parseDate(module.startDate) : null,
          endDate: module.endDate ? parseDate(module.endDate) : null,
          position: module.position,
          createdAt: parseDate(module.createdAt),
          updatedAt: parseDate(module.updatedAt, parseDate(module.createdAt)),
        });
      }

      for (const page of projectSnapshot.pages) {
        const targetPageId = createId();

        await tx.insert(schema.pageTable).values({
          id: targetPageId,
          projectId: targetProjectId,
          title: page.title,
          slug: page.slug,
          content: page.content,
          isPublic: page.isPublic,
          createdBy: page.createdBy
            ? (sourceUserIdToTargetUserId.get(page.createdBy) ?? null)
            : null,
          createdAt: parseDate(page.createdAt),
          updatedAt: parseDate(page.updatedAt, parseDate(page.createdAt)),
        });
      }

      for (let index = 0; index < projectSnapshot.tasks.length; index += 1) {
        const task = projectSnapshot.tasks[index];
        const targetTaskId = createId();
        taskIdMap.set(task.id, targetTaskId);

        await tx.insert(schema.taskTable).values({
          id: targetTaskId,
          projectId: targetProjectId,
          position: task.position ?? index,
          number: task.number ?? index + 1,
          userId: task.userId
            ? (sourceUserIdToTargetUserId.get(task.userId) ?? null)
            : null,
          title: task.title,
          description: task.description,
          status: task.status,
          columnId: task.columnId
            ? (columnIdMap.get(task.columnId) ?? null)
            : null,
          priority: task.priority ?? "low",
          startDate: task.startDate ? parseDate(task.startDate) : null,
          dueDate: task.dueDate ? parseDate(task.dueDate) : null,
          createdBy: task.createdBy
            ? (sourceUserIdToTargetUserId.get(task.createdBy) ?? null)
            : null,
          createdAt: parseDate(task.createdAt),
          updatedAt: parseDate(task.updatedAt, parseDate(task.createdAt)),
        });
      }

      for (const taskLabel of projectSnapshot.taskLabels) {
        const targetTaskId = taskIdMap.get(taskLabel.taskId);
        const targetLabelId = labelIdMap.get(taskLabel.labelId);
        if (!targetTaskId || !targetLabelId) {
          continue;
        }

        await tx.insert(schema.taskLabelTable).values({
          id: createId(),
          taskId: targetTaskId,
          labelId: targetLabelId,
          createdAt: parseDate(taskLabel.createdAt),
        });
      }

      for (const taskModule of projectSnapshot.taskModules) {
        const targetTaskId = taskIdMap.get(taskModule.taskId);
        const targetModuleId = moduleIdMap.get(taskModule.moduleId);
        if (!targetTaskId || !targetModuleId) {
          continue;
        }

        await tx.insert(schema.taskModuleTable).values({
          id: createId(),
          taskId: targetTaskId,
          moduleId: targetModuleId,
          createdAt: parseDate(taskModule.createdAt),
        });
      }

      for (const taskRelation of projectSnapshot.taskRelations) {
        const sourceTaskId = taskIdMap.get(taskRelation.sourceTaskId);
        const targetTaskId = taskIdMap.get(taskRelation.targetTaskId);
        if (!sourceTaskId || !targetTaskId) {
          continue;
        }

        await tx.insert(schema.taskRelationTable).values({
          id: createId(),
          sourceTaskId,
          targetTaskId,
          relationType: taskRelation.relationType,
          createdAt: parseDate(taskRelation.createdAt),
        });
      }

      for (const timeEntry of projectSnapshot.timeEntries) {
        const targetTaskId = taskIdMap.get(timeEntry.taskId);
        if (!targetTaskId) {
          continue;
        }

        await tx.insert(schema.timeEntryTable).values({
          id: createId(),
          taskId: targetTaskId,
          userId: timeEntry.userId
            ? (sourceUserIdToTargetUserId.get(timeEntry.userId) ?? null)
            : null,
          description: timeEntry.description,
          startTime: parseDate(timeEntry.startTime),
          endTime: timeEntry.endTime ? parseDate(timeEntry.endTime) : null,
          duration: timeEntry.duration ?? 0,
          createdAt: parseDate(timeEntry.createdAt),
        });

        restoredTimeEntries += 1;
      }

      for (const activity of projectSnapshot.commentActivities) {
        const targetTaskId = taskIdMap.get(activity.taskId);
        if (!targetTaskId) {
          continue;
        }

        const targetActivityId = createId();

        await tx.insert(schema.activityTable).values({
          id: targetActivityId,
          taskId: targetTaskId,
          type: "comment",
          createdAt: parseDate(activity.createdAt),
          updatedAt: parseDate(
            activity.updatedAt,
            parseDate(activity.createdAt),
          ),
          userId: activity.userId
            ? (sourceUserIdToTargetUserId.get(activity.userId) ?? null)
            : null,
          content: activity.content,
          eventData:
            activity.eventData === undefined
              ? null
              : (activity.eventData as object),
          externalUserName: activity.externalUserName,
          externalUserAvatar: activity.externalUserAvatar,
          externalSource: activity.externalSource,
          externalUrl: activity.externalUrl,
        });

        restoredComments += 1;
      }

      skippedAssets += projectSnapshot.assets.length;
    }

    return {
      restoredWorkspaceId: workspaceId,
      summary: {
        workspaceMembers: existingWorkspaceUserIds.size,
        projects: backup.projects.length,
        projectMembers: restoredProjectMembers,
        comments: restoredComments,
        timeEntries: restoredTimeEntries,
      },
      skipped: {
        unresolvedWorkspaceMembers: backup.members.filter(
          (member) => !sourceUserIdToTargetUserId.has(member.id),
        ).length,
        assets: skippedAssets,
      },
      warnings: [
        ...(skippedAssets > 0
          ? ["Attachment metadata and binaries are not restored in Phase 2"]
          : []),
      ],
    };
  });
}

export default restoreWorkspaceBackup;
