import { useMutation, useQueryClient } from "@tanstack/react-query";
import addProjectMember from "@/fetchers/project/add-project-member";

function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProjectMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", projectId],
      });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export default useAddProjectMember;
