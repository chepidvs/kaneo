import { useMutation, useQueryClient } from "@tanstack/react-query";
import updatePage from "@/fetchers/page/update-page";

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        slug?: string;
        content?: string;
        isPublic?: boolean;
      };
    }) => updatePage(id, data),
    onSuccess: async (page) => {
      await queryClient.invalidateQueries({ queryKey: ["page", page.id] });
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}
