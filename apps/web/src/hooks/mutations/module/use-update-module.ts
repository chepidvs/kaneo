import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateModule from "@/fetchers/module/update-module";

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string | null; position?: number };
    }) => updateModule(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}
