import { useQuery } from "@tanstack/react-query";
import getActivitesByTaskId from "@/fetchers/activity/get-activites-by-task-id";

function useGetActivitiesByTaskId(taskId: string) {
  return useQuery({
    queryKey: ["activities", taskId],
    queryFn: () => getActivitesByTaskId({ taskId }),
    enabled: Boolean(taskId),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
}

export default useGetActivitiesByTaskId;
