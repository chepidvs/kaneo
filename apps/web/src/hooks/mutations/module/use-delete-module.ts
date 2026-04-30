import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteModule from "@/fetchers/module/delete-module";

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["modules"] });
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
}
