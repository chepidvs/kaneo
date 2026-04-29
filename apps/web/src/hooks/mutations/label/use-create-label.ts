import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateLabelRequest } from "@/fetchers/label/create-label";
import createLabel from "@/fetchers/label/create-label";

type LabelLike = {
  id: string;
  name: string;
  color: string;
};

function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLabel,

    onMutate: async (variables: CreateLabelRequest) => {
      await queryClient.cancelQueries({
        queryKey: ["labels", "project", variables.projectId],
      });

      const previousProjectLabels = queryClient.getQueryData<Array<LabelLike>>([
        "labels",
        "project",
        variables.projectId,
      ]);

      const optimisticLabel: LabelLike = {
        id: `temp-${Date.now()}`,
        name: variables.name,
        color: variables.color,
      };

      queryClient.setQueryData(
        ["labels", "project", variables.projectId],
        (existingLabels: Array<LabelLike> | undefined) => {
          if (!existingLabels) return [optimisticLabel];

          const alreadyExists = existingLabels.some(
            (label) =>
              label.name.toLowerCase() === variables.name.toLowerCase(),
          );

          return alreadyExists
            ? existingLabels
            : [...existingLabels, optimisticLabel];
        },
      );

      return {
        previousProjectLabels,
        projectId: variables.projectId,
        optimisticLabelId: optimisticLabel.id,
      };
    },

    onError: (_error, _variables, context) => {
      if (!context?.projectId) return;

      queryClient.setQueryData(
        ["labels", "project", context.projectId],
        context.previousProjectLabels,
      );
    },

    onSuccess: (createdLabel, variables, context) => {
      queryClient.setQueryData(
        ["labels", "project", variables.projectId],
        (existingLabels: Array<LabelLike> | undefined) => {
          if (!existingLabels) return [createdLabel];

          const withoutOptimisticLabel = existingLabels.filter(
            (label) => label.id !== context?.optimisticLabelId,
          );

          const alreadyExists = withoutOptimisticLabel.some(
            (label) => label.id === createdLabel.id,
          );

          return alreadyExists
            ? withoutOptimisticLabel
            : [...withoutOptimisticLabel, createdLabel];
        },
      );
    },
  });
}

export default useCreateLabel;
