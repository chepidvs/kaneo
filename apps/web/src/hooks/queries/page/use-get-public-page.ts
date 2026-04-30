import { useQuery } from "@tanstack/react-query";
import getPublicPage from "@/fetchers/page/get-public-page";

export function useGetPublicPage(id: string) {
  return useQuery({
    queryKey: ["public-page", id],
    queryFn: () => getPublicPage(id),
    enabled: !!id,
    retry: false,
  });
}
