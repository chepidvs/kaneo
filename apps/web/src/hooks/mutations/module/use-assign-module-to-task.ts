import { useMutation, useQueryClient } from "@tanstack/react-query";
import assignModuleToTask from "@/fetchers/module/assign-module-to-task";

export function useAssignModuleToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      taskId,
    }: {
      moduleId: string;
      taskId: string;
      projectId: string;
    }) => assignModuleToTask(moduleId, taskId),
    onSuccess: async (_, { taskId, projectId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
      ]);
    },
  });
}
