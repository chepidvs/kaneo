import { useMutation, useQueryClient } from "@tanstack/react-query";
import createModule from "@/fetchers/module/create-module";

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: { name: string; description?: string };
    }) => createModule(projectId, data),
    onSuccess: async (_, { projectId }) => {
      await queryClient.invalidateQueries({ queryKey: ["modules", projectId] });
    },
  });
}
