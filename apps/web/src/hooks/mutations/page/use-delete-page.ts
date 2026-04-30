import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePage from "@/fetchers/page/delete-page";

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}
