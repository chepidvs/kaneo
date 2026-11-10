import {
  Archive,
  ArrowUpToLine,
  CalendarIcon,
  Check,
  ChevronDown,
  Menu,
  Trash2,
  X,
} from "lucide-react";
import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import labelColors from "@/constants/label-colors";
import { useBulkOperations } from "@/hooks/mutations/task/use-bulk-operations";
import useGetLabelsByProject from "@/hooks/queries/label/use-get-labels-by-project";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { getColumnIcon } from "@/lib/column";
import { getPriorityLabel } from "@/lib/i18n/domain";
import { getPriorityIcon } from "@/lib/priority";
import { toast } from "@/lib/toast";
import useBacklogBulkSelectionStore from "@/store/backlog-bulk-selection";
import useProjectStore from "@/store/project";
import { Button } from "../ui/button";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "../ui/toolbar";

type BacklogActionItem = {
  value: string;
  label: string;
  icon?: ReactNode;
  checked?: boolean;
  onRun: () => void;
};

type BacklogActionGroup = {
  value: string;
  label: string;
  items: BacklogActionItem[];
};

function BacklogBulkToolbar() {
  const { t } = useTranslation();
  const { selectedTaskIds, clearSelection, selectAll } =
    useBacklogBulkSelectionStore();

  const priorityOptions = useMemo(
    () => [
      { value: "urgent", label: getPriorityLabel("urgent") },
      { value: "high", label: getPriorityLabel("high") },
      { value: "medium", label: getPriorityLabel("medium") },
      { value: "low", label: getPriorityLabel("low") },
      { value: "no-priority", label: getPriorityLabel("no-priority") },
    ],
    [],
  );

  const { project } = useProjectStore();
  const projectId = project?.id ?? "";

  const {
    bulkMoveToBoard,
    bulkDelete,
    bulkArchive,
    bulkAssign,
    bulkPriority,
    bulkAddLabel,
    bulkRemoveLabel,
    bulkDueDate,
  } = useBulkOperations();

  const { data: workspace } = useActiveWorkspace();
  const { data: workspaceUsers } = useGetActiveWorkspaceUsers(
    workspace?.id ?? "",
  );
  const { data: projectLabels = [] } = useGetLabelsByProject(projectId);

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const selectedCount = selectedTaskIds.size;

  const uniqueLabels = useMemo(() => {
    return projectLabels;
  }, [projectLabels]);

  const allTasks = useMemo(() => {
    if (!project) return [];
    const columnTasks = (project.columns ?? []).flatMap((c) => c.tasks ?? []);
    return [
      ...columnTasks,
      ...(project.plannedTasks ?? []),
      ...(project.archivedTasks ?? []),
    ];
  }, [project]);

  const selectedTasks = useMemo(
    () => allTasks.filter((task) => selectedTaskIds.has(task.id)),
    [allTasks, selectedTaskIds],
  );

  const labelsOnAll = useMemo(() => {
    if (selectedTasks.length === 0) return new Set<string>();
    const counts = new Map<string, number>();
    for (const task of selectedTasks) {
      for (const l of task.labels ?? []) {
        counts.set(l.id, (counts.get(l.id) ?? 0) + 1);
      }
    }
    const result = new Set<string>();
    for (const [id, count] of counts) {
      if (count === selectedTasks.length) result.add(id);
    }
    return result;
  }, [selectedTasks]);

  const sharedPriority = useMemo(() => {
    if (selectedTasks.length === 0) return null;
    const first = selectedTasks[0].priority;
    return selectedTasks.every((t) => t.priority === first) ? first : null;
  }, [selectedTasks]);

  const sharedAssigneeId = useMemo(() => {
    if (selectedTasks.length === 0) return null;
    const first = selectedTasks[0].assigneeId ?? null;
    return selectedTasks.every((t) => (t.assigneeId ?? null) === first)
      ? first
      : null;
  }, [selectedTasks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingContext = Boolean(
        target?.closest(
          "input, textarea, [contenteditable='true'], .ProseMirror",
        ),
      );

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        if (isTypingContext) return;
        e.preventDefault();
        selectAll();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectAll, clearSelection]);

  const handleMoveToBoard = useCallback(
    async (status: string) => {
      try {
        await bulkMoveToBoard({
          taskIds: Array.from(selectedTaskIds),
          status,
        });
        toast.success(
          t("tasks:bulk.moveToBoardSuccess", { count: selectedCount }),
        );
        clearSelection();
      } catch (_error) {
        toast.error(t("tasks:bulk.moveToBoardError"));
      }
    },
    [bulkMoveToBoard, selectedTaskIds, selectedCount, clearSelection, t],
  );

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(t("tasks:bulk.deleteConfirm", { count: selectedCount }))) {
      return;
    }

    try {
      await bulkDelete(Array.from(selectedTaskIds));
      toast.success(t("tasks:bulk.deleteSuccess", { count: selectedCount }));
      clearSelection();
      setIsActionsOpen(false);
    } catch (_error) {
      toast.error(t("tasks:bulk.deleteError"));
    }
  }, [bulkDelete, selectedTaskIds, selectedCount, clearSelection, t]);

  const handleBulkArchive = useCallback(async () => {
    try {
      await bulkArchive(Array.from(selectedTaskIds));
      toast.success(t("tasks:bulk.archiveSuccess", { count: selectedCount }));
      clearSelection();
      setIsActionsOpen(false);
    } catch (_error) {
      toast.error(t("tasks:bulk.archiveError"));
    }
  }, [bulkArchive, selectedTaskIds, selectedCount, clearSelection, t]);

  const handleBulkAssign = useCallback(
    async (userId: string) => {
      try {
        await bulkAssign({ taskIds: Array.from(selectedTaskIds), userId });
        toast.success(t("tasks:bulk.assignSuccess", { count: selectedCount }));
      } catch (_error) {
        toast.error(t("tasks:bulk.assignError"));
      }
    },
    [bulkAssign, selectedTaskIds, selectedCount, t],
  );

  const handleBulkPriority = useCallback(
    async (priority: string) => {
      try {
        await bulkPriority({
          taskIds: Array.from(selectedTaskIds),
          priority,
        });
        toast.success(t("tasks:bulk.updateSuccess", { count: selectedCount }));
      } catch (_error) {
        toast.error(t("tasks:bulk.updatePriorityError"));
      }
    },
    [bulkPriority, selectedTaskIds, selectedCount, t],
  );

  const handleBulkAddLabel = useCallback(
    async (labelId: string) => {
      try {
        await bulkAddLabel({
          taskIds: Array.from(selectedTaskIds),
          labelId,
        });
        toast.success(
          t("tasks:bulk.addLabelSuccess", { count: selectedCount }),
        );
      } catch (_error) {
        toast.error(t("tasks:bulk.addLabelError"));
      }
    },
    [bulkAddLabel, selectedTaskIds, selectedCount, t],
  );

  const handleBulkRemoveLabel = useCallback(
    async (labelId: string) => {
      try {
        await bulkRemoveLabel({
          taskIds: Array.from(selectedTaskIds),
          labelId,
        });
        toast.success(
          t("tasks:bulk.removeLabelSuccess", { count: selectedCount }),
        );
      } catch (_error) {
        toast.error(t("tasks:bulk.removeLabelError"));
      }
    },
    [bulkRemoveLabel, selectedTaskIds, selectedCount, t],
  );

  const handleBulkDueDate = useCallback(
    async (date: Date | undefined) => {
      try {
        await bulkDueDate({
          taskIds: Array.from(selectedTaskIds),
          dueDate: date?.toISOString() ?? null,
        });
        toast.success(t("tasks:bulk.updateSuccess", { count: selectedCount }));
        clearSelection();
        setIsDatePickerOpen(false);
      } catch (_error) {
        toast.error(t("tasks:bulk.updateDueDateError"));
      }
    },
    [bulkDueDate, selectedTaskIds, selectedCount, clearSelection, t],
  );

  const groupedItems = useMemo<BacklogActionGroup[]>(
    () => [
      {
        value: "actions",
        label: t("tasks:bulk.actions"),
        items: [
          {
            value: "bulk-delete",
            label: t("tasks:bulk.delete"),
            icon: <Trash2 className="h-4 w-4 text-muted-foreground" />,
            onRun: () => {
              void handleBulkDelete();
            },
          },
          {
            value: "bulk-archive",
            label: t("tasks:bulk.archive"),
            icon: <Archive className="h-4 w-4 text-muted-foreground" />,
            onRun: () => {
              void handleBulkArchive();
            },
          },
        ],
      },
      {
        value: "assign",
        label: t("tasks:bulk.assignTo"),
        items: (workspaceUsers?.members ?? []).map((member) => {
          const checked = sharedAssigneeId === member.userId;
          return {
            value: `assign-${member.userId}`,
            label: member.user?.name || t("common:people.someone"),
            icon: (
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={member.user?.image ?? ""}
                  alt={member.user?.name || ""}
                />
                <AvatarFallback className="border border-border/30 text-xs font-medium">
                  {member.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ),
            checked,
            onRun: () => {
              void handleBulkAssign(checked ? "" : member.userId);
            },
          };
        }),
      },
      {
        value: "priority",
        label: t("tasks:bulk.setPriority"),
        items: priorityOptions.map((opt) => {
          const checked = sharedPriority === opt.value;
          return {
            value: `priority-${opt.value}`,
            label: opt.label,
            icon: getPriorityIcon(opt.value),
            checked,
            onRun: () => {
              if (checked && opt.value !== "no-priority") {
                void handleBulkPriority("no-priority");
              } else {
                void handleBulkPriority(opt.value);
              }
            },
          };
        }),
      },
      {
        value: "label",
        label: t("tasks:bulk.addLabel"),
        items: uniqueLabels.map((label) => {
          const checked = labelsOnAll.has(label.id);
          return {
            value: `label-${label.id}`,
            label: label.name,
            icon: (
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    labelColors.find((c) => c.value === label.color)?.color ||
                    "var(--color-neutral-400)",
                }}
              />
            ),
            checked,
            onRun: () => {
              if (checked) {
                void handleBulkRemoveLabel(label.id);
              } else {
                void handleBulkAddLabel(label.id);
              }
            },
          };
        }),
      },
    ],
    [
      workspaceUsers?.members,
      uniqueLabels,
      labelsOnAll,
      sharedPriority,
      sharedAssigneeId,
      handleBulkDelete,
      handleBulkArchive,
      handleBulkAssign,
      handleBulkPriority,
      handleBulkAddLabel,
      handleBulkRemoveLabel,
      priorityOptions,
      t,
    ],
  );

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <Toolbar className="items-center gap-1 rounded-xl border-border/80 bg-background px-1.5 py-1 shadow-lg/8">
        <ToolbarGroup className="px-1.5">
          <span className="text-sm font-medium text-foreground">
            {t("tasks:bulk.selectedCount", { count: selectedCount })}
          </span>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" className="my-1 h-5" />

        <ToolbarGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-1.5">
                <ArrowUpToLine className="size-4" />
                {t("tasks:bulk.moveToBoard")}
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {(project?.columns ?? []).map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => handleMoveToBoard(col.id)}
                >
                  {getColumnIcon(col.id, col.isFinal)}
                  <span className="ml-2">{col.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" className="my-1 h-5" />

        <ToolbarGroup>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost">
                <CalendarIcon className="size-4" />
                {t("tasks:bulk.setDueDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="center">
              <Calendar
                mode="single"
                onSelect={handleBulkDueDate}
                className="w-full bg-popover"
              />
              <div className="border-t border-border p-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-none text-muted-foreground hover:text-foreground"
                  onClick={() => handleBulkDueDate(undefined)}
                >
                  <X className="h-4 w-4" />
                  {t("tasks:dueDate.clear")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" className="my-1 h-5" />

        <ToolbarGroup>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsActionsOpen(true)}
          >
            <Menu className="size-4" />
            {t("tasks:bulk.actions")}
          </Button>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" className="my-1 h-5" />

        <ToolbarGroup>
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            <X className="size-4" />
          </Button>
        </ToolbarGroup>
      </Toolbar>

      <CommandDialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <CommandDialogPopup>
          <Command items={groupedItems}>
            <CommandInput placeholder={t("tasks:bulk.searchActions")} />
            <CommandPanel>
              <CommandEmpty>{t("tasks:bulk.noActionsFound")}</CommandEmpty>
              <CommandList>
                {(group: BacklogActionGroup, groupIndex: number) => (
                  <Fragment key={group.value}>
                    <CommandGroup items={group.items}>
                      <CommandGroupLabel>{group.label}</CommandGroupLabel>
                      <CommandCollection>
                        {(item: BacklogActionItem) => (
                          <CommandItem
                            key={item.value}
                            value={item.value}
                            onClick={item.onRun}
                            className="gap-1.5 px-3"
                          >
                            <span className="shrink-0">{item.icon}</span>
                            <span className="flex-1 text-sm">{item.label}</span>
                            {item.checked && (
                              <Check className="size-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </CommandItem>
                        )}
                      </CommandCollection>
                    </CommandGroup>
                    {groupIndex < groupedItems.length - 1 && (
                      <CommandSeparator />
                    )}
                  </Fragment>
                )}
              </CommandList>
            </CommandPanel>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>
    </div>
  );
}

export default BacklogBulkToolbar;
