import { useMutation, useQueryClient } from "@tanstack/react-query";
import unassignModuleFromTask from "@/fetchers/module/unassign-module-from-task";

export function useUnassignModuleFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      taskId,
    }: {
      moduleId: string;
      taskId: string;
      projectId: string;
    }) => unassignModuleFromTask(moduleId, taskId),
    onSuccess: async (_, { taskId, projectId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
      ]);
    },
  });
}
