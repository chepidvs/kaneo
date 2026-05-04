import { getApiUrl } from "@/fetchers/get-api-url";
import type { RolePermissions } from "./get-role-permissions";

async function updateRolePermissions(
  workspaceId: string,
  role: string,
  permissions: RolePermissions,
): Promise<RolePermissions> {
  const response = await fetch(
    getApiUrl(`/workspace/${workspaceId}/role-permissions/${role}`),
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateRolePermissions;
