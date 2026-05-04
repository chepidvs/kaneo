import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RolePermissions } from "@/fetchers/workspace/get-role-permissions";
import updateRolePermissions from "@/fetchers/workspace/update-role-permissions";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";

function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  const { data: workspace } = useActiveWorkspace();

  return useMutation({
    mutationFn: ({
      role,
      permissions,
    }: {
      role: string;
      permissions: RolePermissions;
    }) => updateRolePermissions(workspace!.id, role, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["role-permissions", workspace?.id],
      });
    },
  });
}

export default useUpdateRolePermissions;
