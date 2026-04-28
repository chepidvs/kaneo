import { useMutation, useQueryClient } from "@tanstack/react-query";
import removeProjectMember from "@/fetchers/project/remove-project-member";

function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeProjectMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", projectId],
      });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export default useRemoveProjectMember;
