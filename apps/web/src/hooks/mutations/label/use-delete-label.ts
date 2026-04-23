import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteLabel from "@/fetchers/label/delete-label";

function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLabel,
    onSuccess: (deletedLabel) => {
      queryClient.setQueriesData(
        { queryKey: ["labels", "project"] },
        (existingLabels: Array<typeof deletedLabel> | undefined) =>
          existingLabels?.filter((label) => label.id !== deletedLabel.id) ?? [],
      );

      void queryClient.invalidateQueries({
        queryKey: ["labels", "project"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["labels"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["tasks", deletedLabel.projectId],
      });
    },
  });
}

export default useDeleteLabel;