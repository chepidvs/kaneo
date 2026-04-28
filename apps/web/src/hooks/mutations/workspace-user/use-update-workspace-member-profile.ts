import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateWorkspaceMemberProfile from "@/fetchers/workspace-user/update-workspace-member-profile";

function useUpdateWorkspaceMemberProfile(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspaceMemberProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["workspace-users", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["current-user-profile"],
        }),
      ]);
    },
  });
}

export default useUpdateWorkspaceMemberProfile;
