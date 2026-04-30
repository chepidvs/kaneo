import { eq } from "drizzle-orm";
import db from "../../../database";
import { taskTable } from "../../../database/schema";
import { publishEvent } from "../../../events";
import {
  attachProjectLabelToTask,
  getTaskLabels,
  removeTaskLabelByName,
  syncTaskLabelsByName,
} from "../../../label/task-label-sync";
import { findExternalLink } from "../../github/services/link-manager";
import { updateTaskStatus } from "../../github/services/task-service";
import {
  extractIssuePriority,
  extractIssueStatus,
} from "../../github/utils/extract-priority";
import {
  findAllIntegrationsByGiteaRepo,
  repoOwnerLogin,
} from "../services/integration-lookup";
import { isSystemLabelName } from "../utils/system-labels";
import { baseUrlFromRepositoryHtmlUrl } from "../utils/webhook-repo";

type IssueLabeledPayload = {
  action: string;
  issue: {
    number: number;
    labels?: Array<string | { name?: string; color?: string }>;
  };
  label?: {
    name: string;
    color: string;
  };
  repository: {
    owner: { login?: string; username?: string };
    name: string;
    html_url: string;
  };
};

/** Non-system labels from a Gitea issue (used when action is label_updated). */
function giteaLabelsForSync(
  labels: IssueLabeledPayload["issue"]["labels"],
): Array<{ name: string; color?: string }> {
  if (!labels) return [];
  const out: Array<{ name: string; color?: string }> = [];
  for (const raw of labels) {
    const name = typeof raw === "string" ? raw : raw.name;
    if (!name || isSystemLabelName(name)) continue;
    const color =
      typeof raw === "object" && raw && "color" in raw ? raw.color : undefined;
    out.push({ name, color });
  }
  return out;
}

function normalizedGiteaLabelColor(g: { color?: string }): string {
  return g.color ? `#${g.color.replace(/^#/, "")}` : "#6B7280";
}

async function syncGiteaLabelsToTask(
  taskId: string,
  projectId: string,
  giteaLabels: Array<{ name: string; color?: string }>,
) {
  await syncTaskLabelsByName({
    taskId,
    projectId,
    labels: giteaLabels.map((g) => ({
      name: g.name,
      color: normalizedGiteaLabelColor(g),
    })),
  });
}

export async function handleGiteaIssueLabeled(payload: IssueLabeledPayload) {
  const { issue, repository, label: addedLabel } = payload;

  const baseUrl = baseUrlFromRepositoryHtmlUrl(repository.html_url);
  if (!baseUrl) return;

  const owner = repoOwnerLogin(repository);
  const integrations = await findAllIntegrationsByGiteaRepo(
    baseUrl,
    owner,
    repository.name,
  );

  for (const integration of integrations) {
    try {
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
        const statusResult = await updateTaskStatus(
          existingLink.taskId,
          status,
        );
        if (
          statusResult.applied &&
          statusResult.before.status !== statusResult.after.status
        ) {
          await publishEvent("task.status_changed", {
            taskId: statusResult.after.id,
            projectId: statusResult.after.projectId,
            userId: null,
            oldStatus: statusResult.before.status,
            newStatus: statusResult.after.status,
            title: statusResult.after.title,
            assigneeId: statusResult.after.userId,
            type: "status_changed",
          });
        }
      }

      if (payload.action === "label_updated") {
        if (issue.labels === undefined) {
          continue;
        }

        const task = await db.query.taskTable.findFirst({
          where: eq(taskTable.id, existingLink.taskId),
          with: {
            project: true,
          },
        });
        if (task) {
          await syncGiteaLabelsToTask(
            existingLink.taskId,
            task.projectId,
            giteaLabelsForSync(issue.labels),
          );
        }
        continue;
      }

      if (!addedLabel) {
        continue;
      }

      if (isSystemLabelName(addedLabel.name)) {
        continue;
      }

      if (payload.action === "labeled") {
        const task = await db.query.taskTable.findFirst({
          where: eq(taskTable.id, existingLink.taskId),
          with: {
            project: true,
          },
        });

        if (task) {
          const existingLabel = (await getTaskLabels(task.id)).find(
            (label) => label.name === addedLabel.name,
          );

          if (!existingLabel) {
            const color = addedLabel.color
              ? `#${addedLabel.color.replace(/^#/, "")}`
              : "#6B7280";
            await attachProjectLabelToTask({
              taskId: task.id,
              projectId: task.projectId,
              name: addedLabel.name,
              color,
            });
          }
        }
      }

      if (payload.action === "unlabeled") {
        await removeTaskLabelByName(existingLink.taskId, addedLabel.name);
      }
    } catch (error) {
      console.error("Gitea issue_labeled handler failed for integration", {
        integrationId: integration.id,
        issueNumber: issue.number,
        repository: `${owner}/${repository.name}`,
        error,
      });
    }
  }
}
