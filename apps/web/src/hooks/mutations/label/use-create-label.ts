import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateLabelRequest } from "@/fetchers/label/create-label";
import createLabel from "@/fetchers/label/create-label";

function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLabel,
    onSuccess: (createdLabel, variables: CreateLabelRequest) => {
      queryClient.setQueryData(
        ["labels", "project", variables.projectId],
        (existingLabels: Array<typeof createdLabel> | undefined) => {
          if (!existingLabels) return [createdLabel];

          const alreadyExists = existingLabels.some(
            (label) => label.id === createdLabel.id,
          );

          return alreadyExists
            ? existingLabels
            : [...existingLabels, createdLabel];
        },
      );
    },
  });
}

export default useCreateLabel;