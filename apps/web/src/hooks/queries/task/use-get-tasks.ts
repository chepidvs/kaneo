import { useQuery } from "@tanstack/react-query";
import getTasks from "@/fetchers/task/get-tasks";

export function useGetTasks(projectId: string, moduleId?: string) {
  return useQuery({
    queryKey: ["tasks", projectId, moduleId],
    queryFn: () => getTasks(projectId, moduleId),
    refetchInterval: 30000,
    enabled: !!projectId,
  });
}
