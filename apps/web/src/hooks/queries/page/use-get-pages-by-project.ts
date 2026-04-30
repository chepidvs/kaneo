import { useQuery } from "@tanstack/react-query";
import getPagesByProject from "@/fetchers/page/get-pages-by-project";

export function useGetPagesByProject(projectId: string) {
  return useQuery({
    queryKey: ["pages", "project", projectId],
    queryFn: () => getPagesByProject(projectId),
    enabled: !!projectId,
  });
}
