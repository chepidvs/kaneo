import { useInfiniteQuery } from "@tanstack/react-query";
import getWorkspaceTasks from "@/fetchers/task/get-workspace-tasks";

type UseWorkspaceTasksParams = {
  workspaceId: string;
  limit?: number;
  sortBy?: "createdAt" | "dueDate" | "priority" | "title" | "number";
  sortOrder?: "asc" | "desc";
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
};

export function useWorkspaceTasks({
  workspaceId,
  limit = 50,
  sortBy = "createdAt",
  sortOrder = "desc",
  status,
  priority,
  assigneeId,
}: UseWorkspaceTasksParams) {
  return useInfiniteQuery({
    queryKey: [
      "workspace-tasks",
      workspaceId,
      { sortBy, sortOrder, status, priority, assigneeId },
    ],
    queryFn: ({ pageParam }) =>
      getWorkspaceTasks({
        workspaceId,
        page: pageParam as number,
        limit,
        sortBy,
        sortOrder,
        status,
        priority,
        assigneeId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const currentPage = lastPage.pagination.page;
      const totalPages = lastPage.pagination.totalPages;
      if (currentPage >= totalPages) return undefined;
      return (lastPageParam as number) + 1;
    },
    enabled: !!workspaceId,
  });
}
