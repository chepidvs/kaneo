import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { assertCanAccessProject } from "../../utils/permissions/project-access";

async function getProject(id: string, workspaceId: string, userId: string) {
  const project = await db.query.projectTable.findFirst({
    where: and(
      eq(projectTable.id, id),
      eq(projectTable.workspaceId, workspaceId),
    ),
    with: {
      tasks: true,
    },
  });

  if (!project) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  await assertCanAccessProject({
    userId,
    workspaceId,
    projectId: project.id,
    isPublic: project.isPublic,
  });

  return project;
}

export default getProject;
