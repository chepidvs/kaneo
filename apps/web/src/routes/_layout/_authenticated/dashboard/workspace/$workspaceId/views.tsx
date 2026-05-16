import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SortControl from "@/components/common/sort-control";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTitle from "@/components/page-title";
import { ViewsTable } from "@/components/views/views-table";
import { useWorkspaceTasks } from "@/hooks/queries/task/use-workspace-tasks";
import type { SortConfig } from "@/lib/sort-tasks";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/views",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();

  const [sort, setSort] = useState<SortConfig>({
    field: "createdAt",
    direction: "desc",
  });

  const apiSortBy = sort.field === "position" ? "createdAt" : sort.field;
  const apiSortOrder = sort.direction;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useWorkspaceTasks({
      workspaceId,
      sortBy: apiSortBy,
      sortOrder: apiSortOrder,
      limit: 50,
    });

  const tasks = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  function handleSort(
    col: "createdAt" | "dueDate" | "priority" | "title" | "number",
  ) {
    setSort((prev) => ({
      field: col,
      direction:
        prev.field === col && prev.direction === "desc" ? "asc" : "desc",
    }));
  }

  return (
    <>
      <PageTitle title={t("navigation:sidebar.views")} />
      <WorkspaceLayout title={t("navigation:sidebar.views")}>
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <SortControl sort={sort} onSortChange={setSort} />
        </div>
        <ViewsTable
          tasks={tasks}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          sortBy={apiSortBy}
          sortOrder={apiSortOrder}
          onSort={handleSort}
        />
      </WorkspaceLayout>
    </>
  );
}
