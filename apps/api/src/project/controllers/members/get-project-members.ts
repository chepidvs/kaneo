import { and, eq } from "drizzle-orm";
import db, { schema } from "../../../database";

async function getProjectMembers(projectId: string, workspaceId: string) {
  const members = await db
    .select({
      id: schema.userTable.id,
      name: schema.userTable.name,
      email: schema.userTable.email,
      image: schema.userTable.image,
      username: schema.userTable.username,
      role: schema.projectMemberTable.role,
      projectMemberId: schema.projectMemberTable.id,
    })
    .from(schema.projectMemberTable)
    .innerJoin(
      schema.userTable,
      eq(schema.projectMemberTable.userId, schema.userTable.id),
    )
    .where(
      and(
        eq(schema.projectMemberTable.projectId, projectId),
        eq(schema.projectMemberTable.workspaceId, workspaceId),
      ),
    );

  return members;
}

export default getProjectMembers;
