import { useQuery } from "@tanstack/react-query";
import getPage from "@/fetchers/page/get-page";

export function useGetPage(id: string) {
  return useQuery({
    queryKey: ["page", id],
    queryFn: () => getPage(id),
    enabled: !!id,
  });
}
