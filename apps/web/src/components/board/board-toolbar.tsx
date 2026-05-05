import {
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Filter,
  PanelsTopLeft,
  Rows3,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SortControl from "@/components/common/sort-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import labelColors from "@/constants/label-colors";
import type { SavedView } from "@/hooks/use-saved-views";
import {
  type BoardFilters,
  DUE_DATE_FILTER_VALUES,
} from "@/hooks/use-task-filters";
import { getColumnIcon } from "@/lib/column";
import { getPriorityLabel } from "@/lib/i18n/domain";
import { getPriorityIcon } from "@/lib/priority";
import type { SortConfig } from "@/lib/sort-tasks";
import type { ProjectWithTasks } from "@/types/project";

type ProjectLabel = {
  id: string;
  name: string;
  color: string;
};

type ProjectModule = {
  id: string;
  name: string;
};

type ActiveUsers = {
  members?: Array<{
    userId: string;
    user?: {
      image?: string | null;
      name?: string | null;
    } | null;
  }>;
};

type BoardToolbarProps = {
  project?: ProjectWithTasks | null;
  filters: BoardFilters;
  updateFilter: (
    key: keyof BoardFilters,
    value: BoardFilters[keyof BoardFilters],
  ) => void;
  updateLabelFilter: (labelId: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  users?: ActiveUsers;
  projectLabels?: ProjectLabel[];
  projectModules?: ProjectModule[];
  viewMode: "board" | "list";
  setViewMode: (mode: "board" | "list") => void;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  savedViews: SavedView[];
  saveView: (name: string, filters: BoardFilters) => void;
  deleteView: (id: string) => void;
  applyView: (filters: BoardFilters) => void;
};

function CheckSlot({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background"
      }`}
    >
      {checked ? "✓" : null}
    </span>
  );
}

type ActiveFilterChipProps = {
  subject: string;
  operator: string;
  value: ReactNode;
  onClear: () => void;
};

function ActiveFilterChip({
  subject,
  operator,
  value,
  onClear,
}: ActiveFilterChipProps) {
  return (
    <div className="inline-flex h-7 items-center rounded-md border border-border bg-background text-xs shadow-xs">
      <span className="px-2 font-medium text-foreground">{subject}</span>
      <span className="h-full w-px bg-border" />
      <span className="px-2 text-foreground/80">{operator}</span>
      <span className="h-full w-px bg-border" />
      <span className="flex px-2 text-foreground">{value}</span>
      <span className="h-full w-px bg-border" />
      <button
        className="inline-flex h-full w-7 items-center justify-center rounded-r-md text-foreground/70 hover:bg-accent/70 hover:text-foreground"
        onClick={onClear}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function StackedIcons({
  items,
  itemClassName,
}: {
  items: Array<{ id: string; node: ReactNode }>;
  itemClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <span className="inline-flex items-center -space-x-1.5">
      {items.slice(0, 3).map((item) => (
        <span
          key={item.id}
          className={`inline-flex size-4 items-center justify-center rounded-full bg-background ${itemClassName ?? ""}`}
        >
          {item.node}
        </span>
      ))}
    </span>
  );
}

export default function BoardToolbar({
  project,
  filters,
  updateFilter,
  updateLabelFilter,
  clearFilters,
  hasActiveFilters,
  users,
  projectLabels,
  projectModules,
  viewMode,
  setViewMode,
  sort,
  onSortChange,
  savedViews,
  saveView,
  deleteView,
  applyView,
}: BoardToolbarProps) {
  const { t } = useTranslation();
  const [isSavingView, setIsSavingView] = useState(false);
  const [viewName, setViewName] = useState("");
  const viewNameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenSaveView = () => {
    setIsSavingView(true);
    setViewName("");
    window.requestAnimationFrame(() => viewNameInputRef.current?.focus());
  };

  const handleConfirmSaveView = () => {
    const trimmed = viewName.trim();
    if (!trimmed) return;
    saveView(trimmed, filters);
    setIsSavingView(false);
    setViewName("");
  };

  const handleCancelSaveView = () => {
    setIsSavingView(false);
    setViewName("");
  };

  const selectedStatusIds = Array.isArray(filters?.status)
    ? filters.status
    : [];
  const selectedPriorityIds = Array.isArray(filters?.priority)
    ? filters.priority
    : [];
  const selectedAssigneeIds = Array.isArray(filters?.assignee)
    ? filters.assignee
    : [];
  const selectedDueDateFilters = Array.isArray(filters?.dueDate)
    ? filters.dueDate
    : [];
  const selectedLabelIds = Array.isArray(filters?.labels) ? filters.labels : [];
  const selectedModuleIds = Array.isArray(filters?.modules)
    ? filters.modules
    : [];
  const safeProjectLabels = Array.isArray(projectLabels) ? projectLabels : [];
  const safeProjectModules = Array.isArray(projectModules)
    ? projectModules
    : [];

  const getStatusDisplayName = (statusId: string) => {
    const column = project?.columns?.find((col) => col.id === statusId);
    return column?.name || statusId;
  };

  const getStatusIcon = (statusId: string) => {
    const column = project?.columns?.find((col) => col.id === statusId);
    return getColumnIcon(statusId, column?.isFinal);
  };

  const getPriorityDisplayName = (priority: string) =>
    getPriorityLabel(priority);

  const getAssigneeDisplayName = (userId: string) => {
    const member = users?.members?.find((m) => m.userId === userId);
    return member?.user?.name || t("common:people.unknown");
  };

  const getAssigneeAvatar = (userId: string) => {
    const member = users?.members?.find((m) => m.userId === userId);
    return (
      <Avatar className="h-4 w-4">
        <AvatarImage
          src={member?.user?.image ?? ""}
          alt={member?.user?.name || ""}
        />
        <AvatarFallback className="border border-border/30 text-[9px] font-medium">
          {member?.user?.name?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
    );
  };

  const isLabelSelected = (labelId: string) => {
    return selectedLabelIds.includes(labelId);
  };

  const isModuleSelected = (moduleId: string) => {
    return selectedModuleIds.includes(moduleId);
  };

  const toggleStatusFilter = (statusId: string) => {
    const exists = selectedStatusIds.includes(statusId);
    const next = exists
      ? selectedStatusIds.filter((id) => id !== statusId)
      : [...selectedStatusIds, statusId];
    updateFilter("status", next.length > 0 ? next : null);
  };

  const togglePriorityFilter = (priority: string) => {
    const exists = selectedPriorityIds.includes(priority);
    const next = exists
      ? selectedPriorityIds.filter((id) => id !== priority)
      : [...selectedPriorityIds, priority];
    updateFilter("priority", next.length > 0 ? next : null);
  };

  const toggleAssigneeFilter = (userId: string) => {
    const exists = selectedAssigneeIds.includes(userId);
    const next = exists
      ? selectedAssigneeIds.filter((id) => id !== userId)
      : [...selectedAssigneeIds, userId];
    updateFilter("assignee", next.length > 0 ? next : null);
  };

  const toggleDueDateFilter = (dueDate: string) => {
    const exists = selectedDueDateFilters.includes(dueDate);
    const next = exists
      ? selectedDueDateFilters.filter((id) => id !== dueDate)
      : [...selectedDueDateFilters, dueDate];
    updateFilter("dueDate", next.length > 0 ? next : null);
  };

  const toggleLabel = (labelId: string) => {
    updateLabelFilter(labelId);
  };

  const toggleModuleFilter = (moduleId: string) => {
    const exists = selectedModuleIds.includes(moduleId);
    const next = exists
      ? selectedModuleIds.filter((id) => id !== moduleId)
      : [...selectedModuleIds, moduleId];
    updateFilter("modules", next.length > 0 ? next : null);
  };

  const clearLabelFilters = () => {
    if (selectedLabelIds.length === 0) return;
    for (const labelId of selectedLabelIds) {
      updateLabelFilter(labelId);
    }
  };

  const clearModuleFilters = () => {
    updateFilter("modules", null);
  };

  return (
    <div className="border-border/80 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex min-h-10 items-center px-2 py-1.5 md:px-3">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-foreground text-xs font-medium outline-none ring-0 hover:bg-accent/60"
                  />
                }
              >
                <Filter className="h-3 w-3" />
                {t("common:actions.filter")}
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
                    {t("tasks:boardFilters.filterBy")}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-8 rounded-md text-sm">
                    {t("tasks:boardFilters.subjects.status")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72">
                    <div className="grid grid-cols-1 gap-1 p-1">
                      <button
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                          selectedStatusIds.length === 0
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                        }`}
                        onClick={() => updateFilter("status", null)}
                        type="button"
                      >
                        <CheckSlot checked={selectedStatusIds.length === 0} />
                        {t("tasks:boardFilters.allStatuses")}
                      </button>

                      {project?.columns?.map((column) => (
                        <button
                          key={column.id}
                          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                            selectedStatusIds.includes(column.id)
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                          }`}
                          onClick={() => toggleStatusFilter(column.id)}
                          type="button"
                        >
                          <CheckSlot
                            checked={selectedStatusIds.includes(column.id)}
                          />
                          <span className="inline-flex h-4 w-4 items-center justify-center">
                            {getStatusIcon(column.id)}
                          </span>
                          <span className="truncate">{column.name}</span>
                        </button>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-8 rounded-md text-sm">
                    {t("tasks:boardFilters.subjects.priority")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72">
                    <div className="grid grid-cols-1 gap-1 p-1">
                      <button
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                          selectedPriorityIds.length === 0
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                        }`}
                        onClick={() => updateFilter("priority", null)}
                        type="button"
                      >
                        <CheckSlot checked={selectedPriorityIds.length === 0} />
                        {t("tasks:boardFilters.allPriorities")}
                      </button>

                      {["urgent", "high", "medium", "low"].map((priority) => (
                        <button
                          key={priority}
                          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                            selectedPriorityIds.includes(priority)
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                          }`}
                          onClick={() => togglePriorityFilter(priority)}
                          type="button"
                        >
                          <CheckSlot
                            checked={selectedPriorityIds.includes(priority)}
                          />
                          <span className="inline-flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                            {getPriorityIcon(priority)}
                          </span>
                          <span className="truncate capitalize">
                            {getPriorityDisplayName(priority)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-8 rounded-md text-sm">
                    {t("tasks:boardFilters.subjects.assignee")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    <div className="grid grid-cols-1 gap-1 p-1">
                      <button
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                          selectedAssigneeIds.length === 0
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                        }`}
                        onClick={() => updateFilter("assignee", null)}
                        type="button"
                      >
                        <CheckSlot checked={selectedAssigneeIds.length === 0} />
                        {t("tasks:boardFilters.allAssignees")}
                      </button>

                      {users?.members?.map((member) => (
                        <button
                          key={member.userId}
                          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                            selectedAssigneeIds.includes(member.userId)
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                          }`}
                          onClick={() => toggleAssigneeFilter(member.userId)}
                          type="button"
                        >
                          <CheckSlot
                            checked={selectedAssigneeIds.includes(
                              member.userId,
                            )}
                          />
                          <span className="inline-flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={member.user?.image ?? ""}
                                alt={member.user?.name || ""}
                              />
                              <AvatarFallback className="border border-border/30 text-[10px] font-medium">
                                {member.user?.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user?.name}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-8 rounded-md text-sm">
                    {t("tasks:boardFilters.subjects.dueDate")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <div className="grid grid-cols-1 gap-1 p-1">
                      <button
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                          selectedDueDateFilters.length === 0
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                        }`}
                        onClick={() => updateFilter("dueDate", null)}
                        type="button"
                      >
                        <CheckSlot
                          checked={selectedDueDateFilters.length === 0}
                        />
                        {t("tasks:boardFilters.allDueDates")}
                      </button>

                      {[
                        DUE_DATE_FILTER_VALUES.dueThisWeek,
                        DUE_DATE_FILTER_VALUES.dueNextWeek,
                        DUE_DATE_FILTER_VALUES.noDueDate,
                      ].map((dueDate) => (
                        <button
                          key={dueDate}
                          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-xs ${
                            selectedDueDateFilters.includes(dueDate)
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
                          }`}
                          onClick={() => toggleDueDateFilter(dueDate)}
                          type="button"
                        >
                          <CheckSlot
                            checked={selectedDueDateFilters.includes(dueDate)}
                          />
                          {t(
                            `tasks:backlog.filters.${
                              dueDate === DUE_DATE_FILTER_VALUES.dueThisWeek
                                ? "dueThisWeek"
                                : dueDate === DUE_DATE_FILTER_VALUES.dueNextWeek
                                  ? "dueNextWeek"
                                  : "noDueDate"
                            }`,
                          )}
                        </button>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-8 rounded-md text-sm">
                    {t("tasks:properties.labels")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    <DropdownMenuItem
                      onClick={clearLabelFilters}
                      className="h-8 rounded-md text-sm"
                    >
                      <CheckSlot checked={selectedLabelIds.length === 0} />
                      {t("tasks:boardFilters.allLabels")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {safeProjectLabels.length > 0 ? (
                      safeProjectLabels.map((label) => (
                        <DropdownMenuItem
                          key={label.id}
                          onClick={() => toggleLabel(label.id)}
                          className="h-8 rounded-md text-sm"
                        >
                          <CheckSlot checked={isLabelSelected(label.id)} />
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                labelColors.find((c) => c.value === label.color)
                                  ?.color || "var(--color-neutral-400)",
                            }}
                          />
                          <span className="max-w-20 truncate">
                            {label.name}
                          </span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem
                        disabled
                        className="h-8 rounded-md text-sm text-muted-foreground"
                      >
                        {t("tasks:labels.empty")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-8 rounded-md text-sm">
                    Module
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    <DropdownMenuItem
                      onClick={clearModuleFilters}
                      className="h-8 rounded-md text-sm"
                    >
                      <CheckSlot checked={selectedModuleIds.length === 0} />
                      All modules
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {safeProjectModules.length > 0 ? (
                      safeProjectModules.map((module) => (
                        <DropdownMenuItem
                          key={module.id}
                          onClick={() => toggleModuleFilter(module.id)}
                          className="h-8 rounded-md text-sm"
                        >
                          <CheckSlot checked={isModuleSelected(module.id)} />
                          <Shapes className="size-4 text-muted-foreground" />
                          <span className="max-w-28 truncate">
                            {module.name}
                          </span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem
                        disabled
                        className="h-8 rounded-md text-muted-foreground text-sm"
                      >
                        No modules
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clearFilters}
                      className="h-8 rounded-md text-sm text-muted-foreground"
                    >
                      {t("common:actions.clearAllFilters")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <SortControl sort={sort} onSortChange={onSortChange} />

            {/* Saved views dropdown */}
            {savedViews.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-foreground text-xs font-medium outline-none ring-0 hover:bg-accent/60"
                    />
                  }
                >
                  <BookmarkCheck className="h-3 w-3" />
                  {t("tasks:savedViews.title")}
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
                    {savedViews.length}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
                      {t("tasks:savedViews.title")}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {savedViews.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      className="flex items-center justify-between gap-2 pr-1"
                      onClick={() => applyView(view.filters)}
                    >
                      <span className="flex-1 truncate text-sm">
                        {view.name}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteView(view.id);
                        }}
                        title={t("tasks:savedViews.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Save view button / inline input */}
            {hasActiveFilters && !isSavingView && (
              <button
                type="button"
                onClick={handleOpenSaveView}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2.5 text-xs font-medium text-muted-foreground outline-none hover:border-solid hover:bg-accent/60 hover:text-foreground"
              >
                <BookmarkPlus className="h-3 w-3" />
                {t("tasks:savedViews.save")}
              </button>
            )}

            {isSavingView && (
              <div className="inline-flex h-7 items-center gap-1 rounded-md border border-primary/40 bg-background px-1.5 shadow-xs">
                <Bookmark className="h-3 w-3 shrink-0 text-muted-foreground" />
                <input
                  ref={viewNameInputRef}
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSaveView();
                    if (e.key === "Escape") handleCancelSaveView();
                  }}
                  placeholder={t("tasks:savedViews.namePlaceholder")}
                  className="h-full w-32 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmSaveView}
                  disabled={!viewName.trim()}
                  className="inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40"
                >
                  {t("tasks:savedViews.confirm")}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSaveView}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {selectedStatusIds.length > 0 && (
              <ActiveFilterChip
                subject={t("tasks:boardFilters.subjects.status")}
                operator={t("tasks:boardFilters.operators.isAnyOf")}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <StackedIcons
                      items={selectedStatusIds.map((statusId) => ({
                        id: statusId,
                        node: getStatusIcon(statusId),
                      }))}
                      itemClassName="[&>svg]:h-3.5 [&>svg]:w-3.5"
                    />
                    <span>
                      {selectedStatusIds.length === 1
                        ? getStatusDisplayName(selectedStatusIds[0])
                        : t("tasks:boardFilters.selectedCount", {
                            count: selectedStatusIds.length,
                          })}
                    </span>
                  </span>
                }
                onClear={() => updateFilter("status", null)}
              />
            )}

            {selectedPriorityIds.length > 0 && (
              <ActiveFilterChip
                subject={t("tasks:boardFilters.subjects.priority")}
                operator={t("tasks:boardFilters.operators.isAnyOf")}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <StackedIcons
                      items={selectedPriorityIds.map((priority) => ({
                        id: priority,
                        node: getPriorityIcon(priority),
                      }))}
                    />
                    <span>
                      {selectedPriorityIds.length === 1
                        ? getPriorityDisplayName(selectedPriorityIds[0])
                        : t("tasks:boardFilters.selectedCount", {
                            count: selectedPriorityIds.length,
                          })}
                    </span>
                  </span>
                }
                onClear={() => updateFilter("priority", null)}
              />
            )}

            {selectedAssigneeIds.length > 0 && (
              <ActiveFilterChip
                subject={t("tasks:boardFilters.subjects.assignee")}
                operator={t("tasks:boardFilters.operators.isAnyOf")}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <StackedIcons
                      items={selectedAssigneeIds.map((userId) => ({
                        id: userId,
                        node: getAssigneeAvatar(userId),
                      }))}
                    />
                    <span>
                      {selectedAssigneeIds.length === 1
                        ? getAssigneeDisplayName(selectedAssigneeIds[0])
                        : t("tasks:boardFilters.selectedCount", {
                            count: selectedAssigneeIds.length,
                          })}
                    </span>
                  </span>
                }
                onClear={() => updateFilter("assignee", null)}
              />
            )}

            {selectedDueDateFilters.length > 0 && (
              <ActiveFilterChip
                subject={t("tasks:boardFilters.subjects.dueDate")}
                operator={t("tasks:boardFilters.operators.isAnyOf")}
                value={
                  selectedDueDateFilters.length === 1
                    ? t(
                        `tasks:backlog.filters.${
                          selectedDueDateFilters[0] ===
                          DUE_DATE_FILTER_VALUES.dueThisWeek
                            ? "dueThisWeek"
                            : selectedDueDateFilters[0] ===
                                DUE_DATE_FILTER_VALUES.dueNextWeek
                              ? "dueNextWeek"
                              : "noDueDate"
                        }`,
                      )
                    : t("tasks:boardFilters.selectedCount", {
                        count: selectedDueDateFilters.length,
                      })
                }
                onClear={() => updateFilter("dueDate", null)}
              />
            )}

            {selectedLabelIds.length > 0 && (
              <ActiveFilterChip
                subject={t("tasks:boardFilters.subjects.labels")}
                operator={t("tasks:boardFilters.operators.includeAnyOf")}
                value={t("tasks:boardFilters.selectedCount", {
                  count: selectedLabelIds.length,
                })}
                onClear={clearLabelFilters}
              />
            )}

            {selectedModuleIds.length > 0 && (
              <ActiveFilterChip
                subject="Module"
                operator={t("tasks:boardFilters.operators.isAnyOf")}
                value={
                  selectedModuleIds.length === 1
                    ? (safeProjectModules.find(
                        (module) => module.id === selectedModuleIds[0],
                      )?.name ?? "Unknown")
                    : t("tasks:boardFilters.selectedCount", {
                        count: selectedModuleIds.length,
                      })
                }
                onClear={clearModuleFilters}
              />
            )}
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
              onClick={() => setViewMode("board")}
            >
              <PanelsTopLeft className="h-3 w-3" />
              {t("tasks:view.board")}
            </button>
            <button
              type="button"
              className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
            >
              <Rows3 className="h-3 w-3" />
              {t("tasks:view.list")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
