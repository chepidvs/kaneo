import { eq } from "drizzle-orm";
import db from "../../../database";
import { taskTable } from "../../../database/schema";
import {
  attachProjectLabelToTask,
  removeTaskLabelByName,
} from "../../../label/task-label-sync";
import { findExternalLink } from "../services/link-manager";
import {
  findAllIntegrationsByRepo,
  updateTaskStatus,
} from "../services/task-service";
import {
  extractIssuePriority,
  extractIssueStatus,
} from "../utils/extract-priority";

type IssueLabeledPayload = {
  action: string;
  issue: {
    number: number;
    labels?: Array<string | { name?: string }>;
  };
  label?: {
    name: string;
    color: string;
  };
  repository: {
    owner: { login: string };
    name: string;
  };
};

export async function handleIssueLabeled(payload: IssueLabeledPayload) {
  const { issue, repository, label: addedLabel } = payload;

  const integrations = await findAllIntegrationsByRepo(
    repository.owner.login,
    repository.name,
  );

  for (const integration of integrations) {
    const existingLink = await findExternalLink(
      integration.id,
      "issue",
      issue.number.toString(),
    );

    if (!existingLink) {
      continue;
    }

    const priority = extractIssuePriority(issue.labels);
    const status = extractIssueStatus(issue.labels);

    if (priority) {
      await db
        .update(taskTable)
        .set({ priority })
        .where(eq(taskTable.id, existingLink.taskId));
    }

    if (status) {
      await updateTaskStatus(existingLink.taskId, status);
    }

    if (!addedLabel) {
      return;
    }

    const isSystemLabel =
      addedLabel.name.startsWith("priority:") ||
      addedLabel.name.startsWith("status:");

    if (isSystemLabel) {
      return;
    }

    if (payload.action === "labeled") {
      const task = await db.query.taskTable.findFirst({
        where: eq(taskTable.id, existingLink.taskId),
        with: {
          project: true,
        },
      });

      if (task) {
        const color = addedLabel.color ? `#${addedLabel.color}` : "#6B7280";
        await attachProjectLabelToTask({
          taskId: task.id,
          projectId: task.projectId,
          name: addedLabel.name,
          color,
        });
      }
    }

    if (payload.action === "unlabeled") {
      await removeTaskLabelByName(existingLink.taskId, addedLabel.name);
    }

    return;
  }
}
