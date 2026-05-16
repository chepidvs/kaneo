import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Tag } from "lucide-react";
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkspaceTask } from "@/fetchers/task/get-workspace-tasks";
import { cn } from "@/lib/cn";
import { getPriorityIcon } from "@/lib/priority";

const labelColorMap: Record<string, string> = {
  gray: "var(--color-stone-500)",
  "dark-gray": "var(--color-slate-500)",
  purple: "var(--color-violet-500)",
  teal: "var(--color-emerald-600)",
  green: "var(--color-green-600)",
  yellow: "var(--color-amber-600)",
  orange: "var(--color-orange-600)",
  pink: "var(--color-rose-600)",
  red: "var(--color-red-600)",
};

function resolveColor(color: string): string {
  if (labelColorMap[color]) return labelColorMap[color];
  const s = new Option().style;
  s.color = color;
  return s.color !== "" ? color : "var(--color-neutral-400)";
}

type SortBy = "createdAt" | "dueDate" | "priority" | "title" | "number";
type SortOrder = "asc" | "desc";

type ViewsTableProps = {
  workspaceId: string;
  tasks: WorkspaceTask[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSort: (col: SortBy) => void;
};

function SortIcon({
  col,
  sortBy,
  sortOrder,
}: {
  col: SortBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
}) {
  if (sortBy !== col)
    return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
  return sortOrder === "asc" ? (
    <ArrowUp className="h-3 w-3 ml-1 text-foreground" />
  ) : (
    <ArrowDown className="h-3 w-3 ml-1 text-foreground" />
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "to-do": "bg-muted text-muted-foreground",
    "in-progress": "bg-info/10 text-info-foreground",
    done: "bg-success/10 text-success-foreground",
    archived: "bg-muted/50 text-muted-foreground/60",
    planned: "bg-secondary text-secondary-foreground",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  const label = status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize",
        cls,
      )}
    >
      {label}
    </span>
  );
}

export function ViewsTable({
  workspaceId,
  tasks,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  sortBy,
  sortOrder,
  onSort,
}: ViewsTableProps) {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);

  function handleTaskClick(task: WorkspaceTask) {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
      params: { workspaceId, projectId: task.projectId },
      search: { taskId: task.id },
    });
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const showEmptyState = !isLoading && tasks.length === 0;

  return (
    <div className="w-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60 flex items-center gap-0 text-xs font-medium text-muted-foreground">
        <button
          type="button"
          onClick={() => onSort("title")}
          className="flex items-center px-4 py-2.5 flex-1 min-w-0 hover:text-foreground transition-colors text-left"
        >
          Work Items
          <SortIcon col="title" sortBy={sortBy} sortOrder={sortOrder} />
        </button>
        <button
          type="button"
          onClick={() => onSort("createdAt")}
          className="flex items-center px-4 py-2.5 w-28 shrink-0 hover:text-foreground transition-colors"
        >
          State
          <SortIcon col="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
        </button>
        <button
          type="button"
          onClick={() => onSort("priority")}
          className="flex items-center px-4 py-2.5 w-28 shrink-0 hover:text-foreground transition-colors"
        >
          Priority
          <SortIcon col="priority" sortBy={sortBy} sortOrder={sortOrder} />
        </button>
        <div className="px-4 py-2.5 w-28 shrink-0">Assignees</div>
        <div className="px-4 py-2.5 w-32 shrink-0">Labels</div>
      </div>

      {isLoading &&
        Array.from({ length: 8 }, (_, i) => i).map((i) => (
          <div
            key={i}
            className="border-b border-border/40 px-4 py-3 flex items-center gap-4"
          >
            <Skeleton className="h-3 flex-1 min-w-0" />
            <Skeleton className="h-3 w-20 shrink-0" />
            <Skeleton className="h-3 w-20 shrink-0" />
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-24 shrink-0" />
          </div>
        ))}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Tag className="h-10 w-10 opacity-30" />
          <p className="text-sm">No tasks found across your projects</p>
        </div>
      )}

      {/* Rows */}
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => handleTaskClick(task)}
          className="w-full text-left flex items-center gap-0 border-b border-border/40 hover:bg-accent/40 transition-colors group cursor-pointer focus:outline-none focus-visible:bg-accent/40"
        >
          {/* Work Item */}
          <div className="flex items-center gap-2 px-4 py-2.5 flex-1 min-w-0">
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {task.projectSlug}-{task.number}
            </span>
            <span className="text-sm text-foreground truncate">
              {task.title}
            </span>
          </div>

          {/* State */}
          <div className="px-4 py-2.5 w-28 shrink-0">
            <StatusBadge status={task.status} />
          </div>

          {/* Priority */}
          <div className="px-4 py-2.5 w-28 shrink-0 flex items-center gap-1">
            <span className="shrink-0">
              {getPriorityIcon(task.priority ?? "")}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {task.priority ?? "None"}
            </span>
          </div>

          {/* Assignees */}
          <div className="px-4 py-2.5 w-28 shrink-0">
            {task.assignees.length > 0 ? (
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map((a) => (
                  <Avatar key={a.id} className="h-6 w-6 ring-1 ring-background">
                    <AvatarImage src={a.image ?? ""} alt={a.name || ""} />
                    <AvatarFallback className="text-[9px] font-medium border border-border/30">
                      {a.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted ring-1 ring-background">
                    <span className="text-[9px] font-medium text-muted-foreground">
                      +{task.assignees.length - 3}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center"
                title="Unassigned"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  ?
                </span>
              </div>
            )}
          </div>

          {/* Labels */}
          <div className="px-4 py-2.5 w-32 shrink-0">
            {task.labels.length === 0 ? (
              <span className="text-xs text-muted-foreground/50">—</span>
            ) : task.labels.length === 1 ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: resolveColor(task.labels[0].color),
                  }}
                />
                <span className="truncate max-w-[80px]">
                  {task.labels[0].name}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Tag className="h-3 w-3 shrink-0" />
                {task.labels.length} Labels
              </span>
            )}
          </div>
        </button>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="px-4 py-3 space-y-2">
          {Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
