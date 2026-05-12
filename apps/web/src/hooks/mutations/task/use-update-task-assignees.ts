import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateTaskAssignees from "@/fetchers/task/update-task-assignees";

export function useUpdateTaskAssignees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      taskId: string;
      projectId: string;
      userIds: string[];
    }) => updateTaskAssignees(variables.taskId, variables.userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task", variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ["task-relations"],
      });
    },
  });
}
