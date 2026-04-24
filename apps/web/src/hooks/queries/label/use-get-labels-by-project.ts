import { useQuery } from "@tanstack/react-query";
import getLabelsByProject from "@/fetchers/label/get-labels-by-project";

function useGetLabelsByProject(projectId: string) {
  return useQuery({
    queryKey: ["labels", "project", projectId],
    queryFn: () => getLabelsByProject({ projectId }),
    enabled: !!projectId,
  });
}

export default useGetLabelsByProject;
