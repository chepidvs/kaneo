import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/fetchers/get-api-url";

type GetWorkspaceUsersRequest = {
  workspaceId?: string;
};

function useGetWorkspaceUsers({ workspaceId }: GetWorkspaceUsersRequest) {
  return useQuery({
    queryKey: ["workspace-users", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const url = getApiUrl(`/workspace/${workspaceId}/members`);
      console.log("fetch workspace members url:", url);

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("workspace members fetch failed:", {
          status: response.status,
          url,
          text,
        });
        throw new Error("Failed to fetch workspace users");
      }

      return response.json();
    },
  });
}

export default useGetWorkspaceUsers;
