import { eq } from "drizzle-orm";
import db, { schema } from "../../database";

export type RolePermissions = Record<string, string[]>;

export type AllRolePermissions = {
  admin: RolePermissions;
  member: RolePermissions;
  guest: RolePermissions;
};

const CONFIGURABLE_ROLES = ["admin", "member", "guest"] as const;

export const DEFAULT_PERMISSIONS: AllRolePermissions = {
  admin: {
    project: ["create", "read", "update", "delete", "share"],
    task: ["create", "read", "update", "delete", "assign"],
    workspace: ["read", "update", "manage_settings"],
    team: ["invite", "remove"],
  },
  member: {
    project: ["create", "read"],
    task: ["create", "read", "update"],
    workspace: ["read"],
    team: [],
  },
  guest: {
    project: ["read"],
    task: ["read"],
    workspace: ["read"],
    team: [],
  },
};

export async function getRolePermissions(
  workspaceId: string,
): Promise<AllRolePermissions> {
  const rows = await db
    .select({
      role: schema.workspaceRolePermissionsTable.role,
      permissions: schema.workspaceRolePermissionsTable.permissions,
    })
    .from(schema.workspaceRolePermissionsTable)
    .where(eq(schema.workspaceRolePermissionsTable.workspaceId, workspaceId));

  const result = { ...DEFAULT_PERMISSIONS };

  for (const row of rows) {
    if (
      CONFIGURABLE_ROLES.includes(
        row.role as (typeof CONFIGURABLE_ROLES)[number],
      )
    ) {
      result[row.role as keyof AllRolePermissions] =
        row.permissions as RolePermissions;
    }
  }

  return result;
}
