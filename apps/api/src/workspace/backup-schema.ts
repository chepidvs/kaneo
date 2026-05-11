type JsonRecord = Record<string, unknown>;

export type WorkspaceBackupRolePermissions = Record<string, string[]>;

export type WorkspaceBackup = {
  meta: {
    formatVersion: number;
    exportedAt: string;
    sourceWorkspace: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    };
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    createdAt: string | null;
  };
  members: Array<{
    id: string;
    memberId: string;
    name: string;
    email: string;
    image: string | null;
    username: string | null;
    role: string;
    joinedAt: string | null;
  }>;
  rolePermissions: {
    admin: WorkspaceBackupRolePermissions;
    member: WorkspaceBackupRolePermissions;
    guest: WorkspaceBackupRolePermissions;
  };
  projects: Array<{
    project: {
      id: string;
      workspaceId: string;
      slug: string;
      icon: string | null;
      name: string;
      description: string | null;
      createdAt: string | null;
      isPublic: boolean | null;
      archivedAt: string | null;
    };
    members: Array<{
      id: string;
      projectMemberId: string;
      name: string;
      email: string;
      image: string | null;
      username: string | null;
      role: string;
      createdAt: string | null;
    }>;
    columns: Array<{
      id: string;
      name: string;
      slug: string;
      position: number;
      icon: string | null;
      color: string | null;
      isFinal: boolean;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
    labels: Array<{
      id: string;
      name: string;
      color: string;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
    modules: Array<{
      id: string;
      name: string;
      description: string | null;
      startDate: string | null;
      endDate: string | null;
      position: number;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
    pages: Array<{
      id: string;
      title: string;
      slug: string;
      content: string;
      isPublic: boolean;
      createdBy: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
    tasks: Array<{
      id: string;
      position: number | null;
      number: number | null;
      userId: string | null;
      title: string;
      description: string | null;
      status: string;
      columnId: string | null;
      priority: string | null;
      startDate: string | null;
      dueDate: string | null;
      createdBy: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
    taskLabels: Array<{
      id: string;
      taskId: string;
      labelId: string;
      createdAt: string | null;
    }>;
    taskModules: Array<{
      id: string;
      taskId: string;
      moduleId: string;
      createdAt: string | null;
    }>;
    taskRelations: Array<{
      id: string;
      sourceTaskId: string;
      targetTaskId: string;
      relationType: string;
      createdAt: string | null;
    }>;
    timeEntries: Array<{
      id: string;
      taskId: string;
      userId: string | null;
      description: string | null;
      startTime: string;
      endTime: string | null;
      duration: number | null;
      createdAt: string | null;
    }>;
    commentActivities: Array<{
      id: string;
      taskId: string;
      type: string;
      createdAt: string | null;
      updatedAt: string | null;
      userId: string | null;
      content: string | null;
      eventData: unknown;
      externalUserName: string | null;
      externalUserAvatar: string | null;
      externalSource: string | null;
      externalUrl: string | null;
    }>;
    assets: Array<{
      id: string;
      taskId: string | null;
      activityId: string | null;
      objectKey: string;
      filename: string;
      mimeType: string;
      size: number;
      kind: string | null;
      surface: string | null;
      createdBy: string | null;
      createdAt: string | null;
    }>;
  }>;
  excluded: string[];
};

export type WorkspaceBackupSummary = {
  workspaceMembers: number;
  projects: number;
  projectMembers: number;
  columns: number;
  labels: number;
  modules: number;
  pages: number;
  tasks: number;
  taskLabels: number;
  taskModules: number;
  taskRelations: number;
  timeEntries: number;
  commentActivities: number;
  assets: number;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function asRolePermissions(value: unknown): WorkspaceBackupRolePermissions {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([resource, actions]) => [
      resource,
      asStringArray(actions),
    ]),
  );
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function parseProject(projectValue: unknown) {
  const projectRecord = isRecord(projectValue) ? projectValue : {};
  const project = isRecord(projectRecord.project) ? projectRecord.project : {};

  return {
    project: {
      id: asString(project.id),
      workspaceId: asString(project.workspaceId),
      slug: asString(project.slug),
      icon: asNullableString(project.icon),
      name: asString(project.name),
      description: asNullableString(project.description),
      createdAt: asNullableString(project.createdAt),
      isPublic: typeof project.isPublic === "boolean" ? project.isPublic : null,
      archivedAt: asNullableString(project.archivedAt),
    },
    members: asArray(projectRecord.members).map((memberValue) => {
      const member = isRecord(memberValue) ? memberValue : {};
      return {
        id: asString(member.id),
        projectMemberId: asString(member.projectMemberId),
        name: asString(member.name),
        email: asString(member.email),
        image: asNullableString(member.image),
        username: asNullableString(member.username),
        role: asString(member.role),
        createdAt: asNullableString(member.createdAt),
      };
    }),
    columns: asArray(projectRecord.columns).map((columnValue) => {
      const column = isRecord(columnValue) ? columnValue : {};
      return {
        id: asString(column.id),
        name: asString(column.name),
        slug: asString(column.slug),
        position: asNumber(column.position),
        icon: asNullableString(column.icon),
        color: asNullableString(column.color),
        isFinal: asBoolean(column.isFinal),
        createdAt: asNullableString(column.createdAt),
        updatedAt: asNullableString(column.updatedAt),
      };
    }),
    labels: asArray(projectRecord.labels).map((labelValue) => {
      const label = isRecord(labelValue) ? labelValue : {};
      return {
        id: asString(label.id),
        name: asString(label.name),
        color: asString(label.color),
        createdAt: asNullableString(label.createdAt),
        updatedAt: asNullableString(label.updatedAt),
      };
    }),
    modules: asArray(projectRecord.modules).map((moduleValue) => {
      const module = isRecord(moduleValue) ? moduleValue : {};
      return {
        id: asString(module.id),
        name: asString(module.name),
        description: asNullableString(module.description),
        startDate: asNullableString(module.startDate),
        endDate: asNullableString(module.endDate),
        position: asNumber(module.position),
        createdAt: asNullableString(module.createdAt),
        updatedAt: asNullableString(module.updatedAt),
      };
    }),
    pages: asArray(projectRecord.pages).map((pageValue) => {
      const page = isRecord(pageValue) ? pageValue : {};
      return {
        id: asString(page.id),
        title: asString(page.title),
        slug: asString(page.slug),
        content: asString(page.content),
        isPublic: asBoolean(page.isPublic),
        createdBy: asNullableString(page.createdBy),
        createdAt: asNullableString(page.createdAt),
        updatedAt: asNullableString(page.updatedAt),
      };
    }),
    tasks: asArray(projectRecord.tasks).map((taskValue) => {
      const task = isRecord(taskValue) ? taskValue : {};
      return {
        id: asString(task.id),
        position: asNullableNumber(task.position),
        number: asNullableNumber(task.number),
        userId: asNullableString(task.userId),
        title: asString(task.title),
        description: asNullableString(task.description),
        status: asString(task.status),
        columnId: asNullableString(task.columnId),
        priority: asNullableString(task.priority),
        startDate: asNullableString(task.startDate),
        dueDate: asNullableString(task.dueDate),
        createdBy: asNullableString(task.createdBy),
        createdAt: asNullableString(task.createdAt),
        updatedAt: asNullableString(task.updatedAt),
      };
    }),
    taskLabels: asArray(projectRecord.taskLabels).map((taskLabelValue) => {
      const taskLabel = isRecord(taskLabelValue) ? taskLabelValue : {};
      return {
        id: asString(taskLabel.id),
        taskId: asString(taskLabel.taskId),
        labelId: asString(taskLabel.labelId),
        createdAt: asNullableString(taskLabel.createdAt),
      };
    }),
    taskModules: asArray(projectRecord.taskModules).map((taskModuleValue) => {
      const taskModule = isRecord(taskModuleValue) ? taskModuleValue : {};
      return {
        id: asString(taskModule.id),
        taskId: asString(taskModule.taskId),
        moduleId: asString(taskModule.moduleId),
        createdAt: asNullableString(taskModule.createdAt),
      };
    }),
    taskRelations: asArray(projectRecord.taskRelations).map(
      (taskRelationValue) => {
        const taskRelation = isRecord(taskRelationValue)
          ? taskRelationValue
          : {};
        return {
          id: asString(taskRelation.id),
          sourceTaskId: asString(taskRelation.sourceTaskId),
          targetTaskId: asString(taskRelation.targetTaskId),
          relationType: asString(taskRelation.relationType),
          createdAt: asNullableString(taskRelation.createdAt),
        };
      },
    ),
    timeEntries: asArray(projectRecord.timeEntries).map((timeEntryValue) => {
      const timeEntry = isRecord(timeEntryValue) ? timeEntryValue : {};
      return {
        id: asString(timeEntry.id),
        taskId: asString(timeEntry.taskId),
        userId: asNullableString(timeEntry.userId),
        description: asNullableString(timeEntry.description),
        startTime: asString(timeEntry.startTime),
        endTime: asNullableString(timeEntry.endTime),
        duration: asNullableNumber(timeEntry.duration),
        createdAt: asNullableString(timeEntry.createdAt),
      };
    }),
    commentActivities: asArray(projectRecord.commentActivities).map(
      (activityValue) => {
        const activity = isRecord(activityValue) ? activityValue : {};
        return {
          id: asString(activity.id),
          taskId: asString(activity.taskId),
          type: asString(activity.type),
          createdAt: asNullableString(activity.createdAt),
          updatedAt: asNullableString(activity.updatedAt),
          userId: asNullableString(activity.userId),
          content: asNullableString(activity.content),
          eventData: activity.eventData,
          externalUserName: asNullableString(activity.externalUserName),
          externalUserAvatar: asNullableString(activity.externalUserAvatar),
          externalSource: asNullableString(activity.externalSource),
          externalUrl: asNullableString(activity.externalUrl),
        };
      },
    ),
    assets: asArray(projectRecord.assets).map((assetValue) => {
      const asset = isRecord(assetValue) ? assetValue : {};
      return {
        id: asString(asset.id),
        taskId: asNullableString(asset.taskId),
        activityId: asNullableString(asset.activityId),
        objectKey: asString(asset.objectKey),
        filename: asString(asset.filename),
        mimeType: asString(asset.mimeType),
        size: asNumber(asset.size),
        kind: asNullableString(asset.kind),
        surface: asNullableString(asset.surface),
        createdBy: asNullableString(asset.createdBy),
        createdAt: asNullableString(asset.createdAt),
      };
    }),
  };
}

export function parseWorkspaceBackup(input: unknown): WorkspaceBackup {
  if (!isRecord(input)) {
    throw new Error("Backup payload must be a JSON object");
  }

  const meta = isRecord(input.meta) ? input.meta : {};
  const sourceWorkspace = isRecord(meta.sourceWorkspace)
    ? meta.sourceWorkspace
    : {};
  const workspace = isRecord(input.workspace) ? input.workspace : {};
  const rolePermissions = isRecord(input.rolePermissions)
    ? input.rolePermissions
    : {};

  const backup: WorkspaceBackup = {
    meta: {
      formatVersion: asNumber(meta.formatVersion, -1),
      exportedAt: asString(meta.exportedAt),
      sourceWorkspace: {
        id: asString(sourceWorkspace.id),
        name: asString(sourceWorkspace.name),
        slug: asString(sourceWorkspace.slug),
        description: asNullableString(sourceWorkspace.description),
      },
    },
    workspace: {
      id: asString(workspace.id),
      name: asString(workspace.name),
      slug: asString(workspace.slug),
      logo: asNullableString(workspace.logo),
      description: asNullableString(workspace.description),
      createdAt: asNullableString(workspace.createdAt),
    },
    members: asArray(input.members).map((memberValue) => {
      const member = isRecord(memberValue) ? memberValue : {};
      return {
        id: asString(member.id),
        memberId: asString(member.memberId),
        name: asString(member.name),
        email: asString(member.email),
        image: asNullableString(member.image),
        username: asNullableString(member.username),
        role: asString(member.role),
        joinedAt: asNullableString(member.joinedAt),
      };
    }),
    rolePermissions: {
      admin: asRolePermissions(rolePermissions.admin),
      member: asRolePermissions(rolePermissions.member),
      guest: asRolePermissions(rolePermissions.guest),
    },
    projects: asArray(input.projects).map(parseProject),
    excluded: asStringArray(input.excluded),
  };

  if (backup.meta.formatVersion !== 1) {
    throw new Error("Unsupported backup format version");
  }

  if (!backup.workspace.name.trim()) {
    throw new Error("Backup workspace name is required");
  }

  return backup;
}

export function summarizeWorkspaceBackup(
  backup: WorkspaceBackup,
): WorkspaceBackupSummary {
  return backup.projects.reduce<WorkspaceBackupSummary>(
    (summary, project) => ({
      workspaceMembers: summary.workspaceMembers,
      projects: summary.projects + 1,
      projectMembers: summary.projectMembers + project.members.length,
      columns: summary.columns + project.columns.length,
      labels: summary.labels + project.labels.length,
      modules: summary.modules + project.modules.length,
      pages: summary.pages + project.pages.length,
      tasks: summary.tasks + project.tasks.length,
      taskLabels: summary.taskLabels + project.taskLabels.length,
      taskModules: summary.taskModules + project.taskModules.length,
      taskRelations: summary.taskRelations + project.taskRelations.length,
      timeEntries: summary.timeEntries + project.timeEntries.length,
      commentActivities:
        summary.commentActivities + project.commentActivities.length,
      assets: summary.assets + project.assets.length,
    }),
    {
      workspaceMembers: backup.members.length,
      projects: 0,
      projectMembers: 0,
      columns: 0,
      labels: 0,
      modules: 0,
      pages: 0,
      tasks: 0,
      taskLabels: 0,
      taskModules: 0,
      taskRelations: 0,
      timeEntries: 0,
      commentActivities: 0,
      assets: 0,
    },
  );
}

export function validateWorkspaceBackupStructure(backup: WorkspaceBackup) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const projectIds = new Set<string>();
  const workspaceMemberIds = new Set(backup.members.map((member) => member.id));
  const allTaskIds = new Set<string>();

  for (const project of backup.projects) {
    if (!project.project.id) {
      errors.push("Project ID is missing in backup");
      continue;
    }

    if (projectIds.has(project.project.id)) {
      errors.push(`Duplicate project ID: ${project.project.id}`);
    }
    projectIds.add(project.project.id);

    const columnIds = new Set(project.columns.map((column) => column.id));
    const labelIds = new Set(project.labels.map((label) => label.id));
    const moduleIds = new Set(project.modules.map((module) => module.id));
    const taskIds = new Set(project.tasks.map((task) => task.id));

    for (const task of project.tasks) {
      allTaskIds.add(task.id);

      if (task.columnId && !columnIds.has(task.columnId)) {
        errors.push(
          `Task "${task.title}" references missing column "${task.columnId}"`,
        );
      }

      if (task.userId && !workspaceMemberIds.has(task.userId)) {
        warnings.push(
          `Task "${task.title}" assignee is not present in workspace members and may be skipped`,
        );
      }
    }

    for (const taskLabel of project.taskLabels) {
      if (!taskIds.has(taskLabel.taskId) || !labelIds.has(taskLabel.labelId)) {
        errors.push(
          `Task label "${taskLabel.id}" references a missing task or label`,
        );
      }
    }

    for (const taskModule of project.taskModules) {
      if (
        !taskIds.has(taskModule.taskId) ||
        !moduleIds.has(taskModule.moduleId)
      ) {
        errors.push(
          `Task module "${taskModule.id}" references a missing task or module`,
        );
      }
    }

    for (const taskRelation of project.taskRelations) {
      if (
        !taskIds.has(taskRelation.sourceTaskId) ||
        !taskIds.has(taskRelation.targetTaskId)
      ) {
        errors.push(
          `Task relation "${taskRelation.id}" references a missing task`,
        );
      }
    }

    for (const timeEntry of project.timeEntries) {
      if (!taskIds.has(timeEntry.taskId)) {
        errors.push(
          `Time entry "${timeEntry.id}" references missing task "${timeEntry.taskId}"`,
        );
      }
    }

    for (const activity of project.commentActivities) {
      if (!taskIds.has(activity.taskId)) {
        errors.push(
          `Comment activity "${activity.id}" references missing task "${activity.taskId}"`,
        );
      }

      if (activity.type !== "comment") {
        errors.push(`Activity "${activity.id}" is not a comment activity`);
      }
    }

    for (const asset of project.assets) {
      if (asset.taskId && !taskIds.has(asset.taskId)) {
        errors.push(
          `Asset "${asset.id}" references missing task "${asset.taskId}"`,
        );
      }
    }

    for (const member of project.members) {
      if (!member.email) {
        errors.push(
          `Project member "${member.projectMemberId || member.id}" is missing email`,
        );
      }
    }
  }

  if (backup.members.length === 0) {
    warnings.push("Backup has no workspace members");
  }

  if (backup.projects.length === 0) {
    warnings.push("Backup has no projects");
  }

  if (
    backup.excluded.includes("binaryAttachments") ||
    backup.excluded.includes("nonCommentActivities")
  ) {
    warnings.push(
      "Attachments and non-comment activity history are excluded from restore",
    );
  }

  return {
    errors,
    warnings,
    summary: summarizeWorkspaceBackup(backup),
    taskIds: allTaskIds,
  };
}
