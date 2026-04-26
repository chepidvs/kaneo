import { useQuery } from "@tanstack/react-query";
import getNotifications from "@/fetchers/notification/get-notifications";

function useGetNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,

    // 🔥 realtime polling
    refetchInterval: 10000, // 10 detik
    refetchOnWindowFocus: true,
  });
}

export default useGetNotifications;
