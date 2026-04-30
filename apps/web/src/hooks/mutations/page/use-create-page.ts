import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPage from "@/fetchers/page/create-page";

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: {
        title: string;
        slug?: string;
        content?: string;
        isPublic?: boolean;
      };
    }) => createPage(projectId, data),
    onSuccess: async (_, { projectId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["pages", "project", projectId],
      });
    },
  });
}
