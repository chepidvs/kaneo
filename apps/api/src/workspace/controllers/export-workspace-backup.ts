import { and, asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../database";
import { getRolePermissions } from "./get-role-permissions";

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

async function exportWorkspaceBackup(workspaceId: string) {
  const workspace = await db.query.workspaceTable.findFirst({
    where: eq(schema.workspaceTable.id, workspaceId),
  });

  if (!workspace) {
    throw new HTTPException(404, {
      message: "Workspace not found",
    });
  }

  const members = await db
    .select({
      id: schema.userTable.id,
      memberId: schema.workspaceUserTable.id,
      name: schema.userTable.name,
      email: schema.userTable.email,
      image: schema.userTable.image,
      username: schema.userTable.username,
      role: schema.workspaceUserTable.role,
      joinedAt: schema.workspaceUserTable.joinedAt,
    })
    .from(schema.workspaceUserTable)
    .innerJoin(
      schema.userTable,
      eq(schema.workspaceUserTable.userId, schema.userTable.id),
    )
    .where(eq(schema.workspaceUserTable.workspaceId, workspaceId))
    .orderBy(
      asc(schema.workspaceUserTable.joinedAt),
      asc(schema.userTable.name),
    );

  const rolePermissions = await getRolePermissions(workspaceId);

  const projects = await db
    .select({
      id: schema.projectTable.id,
      workspaceId: schema.projectTable.workspaceId,
      slug: schema.projectTable.slug,
      icon: schema.projectTable.icon,
      name: schema.projectTable.name,
      description: schema.projectTable.description,
      createdAt: schema.projectTable.createdAt,
      isPublic: schema.projectTable.isPublic,
      archivedAt: schema.projectTable.archivedAt,
    })
    .from(schema.projectTable)
    .where(eq(schema.projectTable.workspaceId, workspaceId))
    .orderBy(asc(schema.projectTable.createdAt), asc(schema.projectTable.name));

  const projectSnapshots = [];

  for (const project of projects) {
    const projectMembers = await db
      .select({
        id: schema.userTable.id,
        projectMemberId: schema.projectMemberTable.id,
        name: schema.userTable.name,
        email: schema.userTable.email,
        image: schema.userTable.image,
        username: schema.userTable.username,
        role: schema.projectMemberTable.role,
        createdAt: schema.projectMemberTable.createdAt,
      })
      .from(schema.projectMemberTable)
      .innerJoin(
        schema.userTable,
        eq(schema.projectMemberTable.userId, schema.userTable.id),
      )
      .where(
        and(
          eq(schema.projectMemberTable.workspaceId, workspaceId),
          eq(schema.projectMemberTable.projectId, project.id),
        ),
      )
      .orderBy(
        asc(schema.projectMemberTable.createdAt),
        asc(schema.userTable.name),
      );

    const columns = await db
      .select({
        id: schema.columnTable.id,
        name: schema.columnTable.name,
        slug: schema.columnTable.slug,
        position: schema.columnTable.position,
        icon: schema.columnTable.icon,
        color: schema.columnTable.color,
        isFinal: schema.columnTable.isFinal,
        createdAt: schema.columnTable.createdAt,
        updatedAt: schema.columnTable.updatedAt,
      })
      .from(schema.columnTable)
      .where(eq(schema.columnTable.projectId, project.id))
      .orderBy(asc(schema.columnTable.position), asc(schema.columnTable.name));

    const labels = await db
      .select({
        id: schema.labelTable.id,
        name: schema.labelTable.name,
        color: schema.labelTable.color,
        createdAt: schema.labelTable.createdAt,
        updatedAt: schema.labelTable.updatedAt,
      })
      .from(schema.labelTable)
      .where(eq(schema.labelTable.projectId, project.id))
      .orderBy(asc(schema.labelTable.createdAt), asc(schema.labelTable.name));

    const modules = await db
      .select({
        id: schema.moduleTable.id,
        name: schema.moduleTable.name,
        description: schema.moduleTable.description,
        startDate: schema.moduleTable.startDate,
        endDate: schema.moduleTable.endDate,
        position: schema.moduleTable.position,
        createdAt: schema.moduleTable.createdAt,
        updatedAt: schema.moduleTable.updatedAt,
      })
      .from(schema.moduleTable)
      .where(eq(schema.moduleTable.projectId, project.id))
      .orderBy(asc(schema.moduleTable.position), asc(schema.moduleTable.name));

    const pages = await db
      .select({
        id: schema.pageTable.id,
        title: schema.pageTable.title,
        slug: schema.pageTable.slug,
        content: schema.pageTable.content,
        isPublic: schema.pageTable.isPublic,
        createdBy: schema.pageTable.createdBy,
        createdAt: schema.pageTable.createdAt,
        updatedAt: schema.pageTable.updatedAt,
      })
      .from(schema.pageTable)
      .where(eq(schema.pageTable.projectId, project.id))
      .orderBy(asc(schema.pageTable.createdAt), asc(schema.pageTable.title));

    const tasks = await db
      .select({
        id: schema.taskTable.id,
        position: schema.taskTable.position,
        number: schema.taskTable.number,
        userId: schema.taskTable.userId,
        title: schema.taskTable.title,
        description: schema.taskTable.description,
        status: schema.taskTable.status,
        columnId: schema.taskTable.columnId,
        priority: schema.taskTable.priority,
        startDate: schema.taskTable.startDate,
        dueDate: schema.taskTable.dueDate,
        createdBy: schema.taskTable.createdBy,
        createdAt: schema.taskTable.createdAt,
        updatedAt: schema.taskTable.updatedAt,
      })
      .from(schema.taskTable)
      .where(eq(schema.taskTable.projectId, project.id))
      .orderBy(asc(schema.taskTable.number), asc(schema.taskTable.position));

    const taskLabels = await db
      .select({
        id: schema.taskLabelTable.id,
        taskId: schema.taskLabelTable.taskId,
        labelId: schema.taskLabelTable.labelId,
        createdAt: schema.taskLabelTable.createdAt,
      })
      .from(schema.taskLabelTable)
      .innerJoin(
        schema.taskTable,
        eq(schema.taskLabelTable.taskId, schema.taskTable.id),
      )
      .where(eq(schema.taskTable.projectId, project.id))
      .orderBy(
        asc(schema.taskLabelTable.createdAt),
        asc(schema.taskLabelTable.taskId),
      );

    const taskModules = await db
      .select({
        id: schema.taskModuleTable.id,
        taskId: schema.taskModuleTable.taskId,
        moduleId: schema.taskModuleTable.moduleId,
        createdAt: schema.taskModuleTable.createdAt,
      })
      .from(schema.taskModuleTable)
      .innerJoin(
        schema.taskTable,
        eq(schema.taskModuleTable.taskId, schema.taskTable.id),
      )
      .where(eq(schema.taskTable.projectId, project.id))
      .orderBy(
        asc(schema.taskModuleTable.createdAt),
        asc(schema.taskModuleTable.taskId),
      );

    const taskRelations = await db
      .select({
        id: schema.taskRelationTable.id,
        sourceTaskId: schema.taskRelationTable.sourceTaskId,
        targetTaskId: schema.taskRelationTable.targetTaskId,
        relationType: schema.taskRelationTable.relationType,
        createdAt: schema.taskRelationTable.createdAt,
      })
      .from(schema.taskRelationTable)
      .innerJoin(
        schema.taskTable,
        eq(schema.taskRelationTable.sourceTaskId, schema.taskTable.id),
      )
      .where(eq(schema.taskTable.projectId, project.id))
      .orderBy(
        asc(schema.taskRelationTable.createdAt),
        asc(schema.taskRelationTable.sourceTaskId),
      );

    const timeEntries = await db
      .select({
        id: schema.timeEntryTable.id,
        taskId: schema.timeEntryTable.taskId,
        userId: schema.timeEntryTable.userId,
        description: schema.timeEntryTable.description,
        startTime: schema.timeEntryTable.startTime,
        endTime: schema.timeEntryTable.endTime,
        duration: schema.timeEntryTable.duration,
        createdAt: schema.timeEntryTable.createdAt,
      })
      .from(schema.timeEntryTable)
      .innerJoin(
        schema.taskTable,
        eq(schema.timeEntryTable.taskId, schema.taskTable.id),
      )
      .where(eq(schema.taskTable.projectId, project.id))
      .orderBy(
        asc(schema.timeEntryTable.createdAt),
        asc(schema.timeEntryTable.startTime),
      );

    const commentActivities = await db
      .select({
        id: schema.activityTable.id,
        taskId: schema.activityTable.taskId,
        type: schema.activityTable.type,
        createdAt: schema.activityTable.createdAt,
        updatedAt: schema.activityTable.updatedAt,
        userId: schema.activityTable.userId,
        content: schema.activityTable.content,
        eventData: schema.activityTable.eventData,
        externalUserName: schema.activityTable.externalUserName,
        externalUserAvatar: schema.activityTable.externalUserAvatar,
        externalSource: schema.activityTable.externalSource,
        externalUrl: schema.activityTable.externalUrl,
      })
      .from(schema.activityTable)
      .innerJoin(
        schema.taskTable,
        eq(schema.activityTable.taskId, schema.taskTable.id),
      )
      .where(
        and(
          eq(schema.taskTable.projectId, project.id),
          eq(schema.activityTable.type, "comment"),
        ),
      )
      .orderBy(
        asc(schema.activityTable.createdAt),
        asc(schema.activityTable.taskId),
      );

    const assets = await db
      .select({
        id: schema.assetTable.id,
        taskId: schema.assetTable.taskId,
        activityId: schema.assetTable.activityId,
        objectKey: schema.assetTable.objectKey,
        filename: schema.assetTable.filename,
        mimeType: schema.assetTable.mimeType,
        size: schema.assetTable.size,
        kind: schema.assetTable.kind,
        surface: schema.assetTable.surface,
        createdBy: schema.assetTable.createdBy,
        createdAt: schema.assetTable.createdAt,
      })
      .from(schema.assetTable)
      .where(
        and(
          eq(schema.assetTable.workspaceId, workspaceId),
          eq(schema.assetTable.projectId, project.id),
        ),
      )
      .orderBy(
        asc(schema.assetTable.createdAt),
        asc(schema.assetTable.filename),
      );

    projectSnapshots.push({
      project: {
        id: project.id,
        workspaceId: project.workspaceId,
        slug: project.slug,
        icon: project.icon,
        name: project.name,
        description: project.description,
        createdAt: toIsoString(project.createdAt),
        isPublic: project.isPublic,
        archivedAt: toIsoString(project.archivedAt),
      },
      members: projectMembers.map((member) => ({
        id: member.id,
        projectMemberId: member.projectMemberId,
        name: member.name,
        email: member.email,
        image: member.image,
        username: member.username,
        role: member.role,
        createdAt: toIsoString(member.createdAt),
      })),
      columns: columns.map((column) => ({
        ...column,
        createdAt: toIsoString(column.createdAt),
        updatedAt: toIsoString(column.updatedAt),
      })),
      labels: labels.map((label) => ({
        ...label,
        createdAt: toIsoString(label.createdAt),
        updatedAt: toIsoString(label.updatedAt),
      })),
      modules: modules.map((module) => ({
        ...module,
        startDate: toIsoString(module.startDate),
        endDate: toIsoString(module.endDate),
        createdAt: toIsoString(module.createdAt),
        updatedAt: toIsoString(module.updatedAt),
      })),
      pages: pages.map((page) => ({
        ...page,
        createdAt: toIsoString(page.createdAt),
        updatedAt: toIsoString(page.updatedAt),
      })),
      tasks: tasks.map((task) => ({
        ...task,
        startDate: toIsoString(task.startDate),
        dueDate: toIsoString(task.dueDate),
        createdAt: toIsoString(task.createdAt),
        updatedAt: toIsoString(task.updatedAt),
      })),
      taskLabels: taskLabels.map((taskLabel) => ({
        ...taskLabel,
        createdAt: toIsoString(taskLabel.createdAt),
      })),
      taskModules: taskModules.map((taskModule) => ({
        ...taskModule,
        createdAt: toIsoString(taskModule.createdAt),
      })),
      taskRelations: taskRelations.map((taskRelation) => ({
        ...taskRelation,
        createdAt: toIsoString(taskRelation.createdAt),
      })),
      timeEntries: timeEntries.map((timeEntry) => ({
        ...timeEntry,
        startTime: toIsoString(timeEntry.startTime),
        endTime: toIsoString(timeEntry.endTime),
        createdAt: toIsoString(timeEntry.createdAt),
      })),
      commentActivities: commentActivities.map((activity) => ({
        ...activity,
        createdAt: toIsoString(activity.createdAt),
        updatedAt: toIsoString(activity.updatedAt),
      })),
      assets: assets.map((asset) => ({
        ...asset,
        createdAt: toIsoString(asset.createdAt),
      })),
    });
  }

  return {
    meta: {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      sourceWorkspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
      },
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo: workspace.logo,
      description: workspace.description,
      createdAt: toIsoString(workspace.createdAt),
    },
    members: members.map((member) => ({
      id: member.id,
      memberId: member.memberId,
      name: member.name,
      email: member.email,
      image: member.image,
      username: member.username,
      role: member.role,
      joinedAt: toIsoString(member.joinedAt),
    })),
    rolePermissions,
    projects: projectSnapshots,
    excluded: [
      "binaryAttachments",
      "authSessions",
      "apiKeys",
      "notificationPreferences",
      "integrations",
      "workflowRules",
      "externalLinks",
      "nonCommentActivities",
    ],
  };
}

export default exportWorkspaceBackup;
