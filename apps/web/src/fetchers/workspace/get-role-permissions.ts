import { getApiUrl } from "@/fetchers/get-api-url";

export type RolePermissions = Record<string, string[]>;

export type AllRolePermissions = {
  admin: RolePermissions;
  member: RolePermissions;
  guest: RolePermissions;
};

async function getRolePermissions(
  workspaceId: string,
): Promise<AllRolePermissions> {
  const response = await fetch(
    getApiUrl(`/workspace/${workspaceId}/role-permissions`),
    { credentials: "include" },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getRolePermissions;
