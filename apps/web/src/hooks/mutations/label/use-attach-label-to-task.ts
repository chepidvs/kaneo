import { useMutation, useQueryClient } from "@tanstack/react-query";
import attachLabelToTask from "@/fetchers/label/attach-label-to-task";
import { addLabelToTaskInTasksCache } from "./sync-task-labels-cache";

type AttachLabelVariables = {
  id: string;
  taskId: string;
};

type LabelLike = {
  id: string;
  name: string;
  color: string;
};

function useAttachLabelToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, taskId }: AttachLabelVariables) =>
      attachLabelToTask({ id, taskId }),

    onMutate: async ({ id, taskId }) => {
      await queryClient.cancelQueries({
        queryKey: ["labels", taskId],
      });

      const previousTaskLabels = queryClient.getQueryData(["labels", taskId]);

      const projectLabelEntries = queryClient.getQueriesData<Array<LabelLike>>({
        queryKey: ["labels", "project"],
      });

      const labelToAttach =
        projectLabelEntries
          .flatMap(([, labels]) => labels ?? [])
          .find((label) => label.id === id) ?? null;

      if (labelToAttach) {
        queryClient.setQueryData(
          ["labels", taskId],
          (existingLabels: Array<LabelLike> | undefined) => {
            if (!existingLabels) return [labelToAttach];

            const alreadyExists = existingLabels.some(
              (existingLabel) => existingLabel.id === labelToAttach.id,
            );

            return alreadyExists
              ? existingLabels
              : [...existingLabels, labelToAttach];
          },
        );

        addLabelToTaskInTasksCache(queryClient, taskId, {
          id: labelToAttach.id,
          name: labelToAttach.name,
          color: labelToAttach.color,
        });
      }

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

export default useAttachLabelToTask;
