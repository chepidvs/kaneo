import { useQuery } from "@tanstack/react-query";
import getRolePermissions from "@/fetchers/workspace/get-role-permissions";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";

export function useRolePermissions() {
  const { data: workspace } = useActiveWorkspace();

  return useQuery({
    queryKey: ["role-permissions", workspace?.id],
    enabled: !!workspace?.id,
    queryFn: () => getRolePermissions(workspace?.id ?? ""),
  });
}
