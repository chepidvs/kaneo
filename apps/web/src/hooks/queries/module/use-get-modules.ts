import { useQuery } from "@tanstack/react-query";
import getModules from "@/fetchers/module/get-modules";

export function useGetModules(projectId: string) {
  return useQuery({
    queryKey: ["modules", projectId],
    queryFn: () => getModules(projectId),
    enabled: !!projectId,
  });
}
