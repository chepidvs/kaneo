import { useMutation, useQueryClient } from "@tanstack/react-query";
import cloneTask from "@/fetchers/task/clone-task";

function useCloneTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: { taskId: string; projectId: string }) =>
      cloneTask(taskId),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

export default useCloneTask;
