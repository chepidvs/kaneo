import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../database";
import type { RolePermissions } from "./get-role-permissions";

const CONFIGURABLE_ROLES = ["admin", "member", "guest"] as const;
type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

// Permissions always locked OFF — cannot be enabled via settings
const LOCKED_OFF: Record<string, string[]> = {
  workspace: ["delete"],
  team: ["manage_roles"],
};

// Permissions always locked ON — cannot be disabled via settings
const LOCKED_ON: Record<string, string[]> = {
  workspace: ["read"],
  project: ["read"],
  task: ["read"],
};

function applyLocks(permissions: RolePermissions): RolePermissions {
  const result: RolePermissions = {};

  for (const [resource, actions] of Object.entries(permissions)) {
    let filtered = [...actions];

    // Remove locked-off actions
    if (LOCKED_OFF[resource]) {
      filtered = filtered.filter((a) => !LOCKED_OFF[resource].includes(a));
    }

    result[resource] = filtered;
  }

  // Enforce locked-on actions
  for (const [resource, actions] of Object.entries(LOCKED_ON)) {
    if (!result[resource]) {
      result[resource] = [...actions];
    } else {
      for (const action of actions) {
        if (!result[resource].includes(action)) {
          result[resource].push(action);
        }
      }
    }
  }

  return result;
}

export async function updateRolePermissions(
  workspaceId: string,
  role: string,
  permissions: RolePermissions,
): Promise<RolePermissions> {
  if (!CONFIGURABLE_ROLES.includes(role as ConfigurableRole)) {
    throw new HTTPException(400, {
      message: `Role "${role}" is not configurable`,
    });
  }

  const sanitized = applyLocks(permissions);

  const [existing] = await db
    .select({ id: schema.workspaceRolePermissionsTable.id })
    .from(schema.workspaceRolePermissionsTable)
    .where(
      and(
        eq(schema.workspaceRolePermissionsTable.workspaceId, workspaceId),
        eq(schema.workspaceRolePermissionsTable.role, role),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(schema.workspaceRolePermissionsTable)
      .set({ permissions: sanitized, updatedAt: new Date() })
      .where(eq(schema.workspaceRolePermissionsTable.id, existing.id));
  } else {
    await db.insert(schema.workspaceRolePermissionsTable).values({
      workspaceId,
      role,
      permissions: sanitized,
    });
  }

  return sanitized;
}
