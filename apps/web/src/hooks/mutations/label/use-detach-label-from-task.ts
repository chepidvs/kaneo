import { useMutation, useQueryClient } from "@tanstack/react-query";
import detachLabelFromTask from "@/fetchers/label/detach-label-from-task";
import { removeLabelFromTaskInTasksCache } from "./sync-task-labels-cache";

type DetachLabelVariables = {
  id: string;
  taskId: string;
};

type LabelLike = {
  id: string;
  name: string;
  color: string;
};

function useDetachLabelFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, taskId }: DetachLabelVariables) =>
      detachLabelFromTask({ id, taskId }),

    onMutate: async ({ id, taskId }) => {
      await queryClient.cancelQueries({
        queryKey: ["labels", taskId],
      });

      const previousTaskLabels =
        queryClient.getQueryData<Array<LabelLike>>(["labels", taskId]) ?? [];

      queryClient.setQueryData(
        ["labels", taskId],
        (existingLabels: Array<LabelLike> | undefined) =>
          existingLabels?.filter((label) => label.id !== id) ?? [],
      );

      removeLabelFromTaskInTasksCache(queryClient, taskId, id);

      return { previousTaskLabels, taskId };
    },

    onError: (_error, _variables, context) => {
      if (context?.taskId) {
        queryClient.setQueryData(
          ["labels", context.taskId],
          context.previousTaskLabels,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["labels", variables.taskId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["activities", variables.taskId],
      });
    },
  });
}

export default useDetachLabelFromTask;
