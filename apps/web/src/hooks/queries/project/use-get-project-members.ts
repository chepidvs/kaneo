import { useQuery } from "@tanstack/react-query";
import getProjectMembers from "@/fetchers/project/get-project-members";

function useGetProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export default useGetProjectMembers;
