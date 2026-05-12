import { Check } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateTaskAssignees } from "@/hooks/mutations/task/use-update-task-assignees";
import useGetProjectMembers from "@/hooks/queries/project/use-get-project-members";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

const INITIAL_VISIBLE_USERS = 40;
const VISIBLE_USERS_STEP = 40;
const MAX_ASSIGNEES = 5;

type TaskAssigneePopoverProps = {
  task: Task;
  children: React.ReactNode;
};

export default function TaskAssigneePopover({
  task,
  children,
}: TaskAssigneePopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [visibleUsersCount, setVisibleUsersCount] = useState(
    INITIAL_VISIBLE_USERS,
  );
  const { mutateAsync: updateTaskAssignees } = useUpdateTaskAssignees();
  const { data: projectMembers = [] } = useGetProjectMembers(task.projectId);

  const currentAssigneeIds = useMemo(() => {
    if (task.assignees?.length) {
      return new Set(task.assignees.map((a) => a.id));
    }
    return task.userId ? new Set([task.userId]) : new Set<string>();
  }, [task.assignees, task.userId]);

  const usersOptions = useMemo(() => {
    return projectMembers.map((member) => ({
      label: member.name ?? member.id,
      value: member.id,
      image: member.image ?? "",
      name: member.name ?? "",
    }));
  }, [projectMembers]);

  const handleToggleAssignee = useCallback(
    async (toggleUserId: string) => {
      const current = [...currentAssigneeIds];
      let next: string[];

      if (currentAssigneeIds.has(toggleUserId)) {
        next = current.filter((id) => id !== toggleUserId);
      } else {
        if (current.length >= MAX_ASSIGNEES) {
          toast.error(
            t("tasks:popover.assignee.maxReached", {
              max: MAX_ASSIGNEES,
              defaultValue: `Maximum ${MAX_ASSIGNEES} assignees allowed`,
            }),
          );
          return;
        }
        next = [...current, toggleUserId];
      }

      try {
        await updateTaskAssignees({
          taskId: task.id,
          projectId: task.projectId,
          userIds: next,
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("tasks:popover.assignee.updateError"),
        );
      }
    },
    [t, task.id, task.projectId, currentAssigneeIds, updateTaskAssignees],
  );

  const handleClearAll = useCallback(async () => {
    try {
      await updateTaskAssignees({
        taskId: task.id,
        projectId: task.projectId,
        userIds: [],
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:popover.assignee.updateError"),
      );
    }
  }, [t, task.id, task.projectId, updateTaskAssignees]);

  const visibleUsersOptions = useMemo(() => {
    return usersOptions?.slice(0, visibleUsersCount) ?? [];
  }, [usersOptions, visibleUsersCount]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setVisibleUsersCount(INITIAL_VISIBLE_USERS);
    }
  }, []);

  const handleListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const nearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 48;

      if (!nearBottom) return;

      setVisibleUsersCount((current) => {
        const totalUsers = usersOptions?.length ?? current;
        return Math.min(current + VISIBLE_USERS_STEP, totalUsers);
      });
    },
    [usersOptions?.length],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div
          className="max-h-80 space-y-1 overflow-y-auto p-1"
          onScroll={handleListScroll}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 px-2"
            onClick={handleClearAll}
          >
            <div
              className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center"
              title={t("tasks:popover.assignee.unassigned")}
            >
              <span className="text-[10px] font-medium text-muted-foreground">
                ?
              </span>
            </div>
            <span className="text-sm">
              {t("tasks:popover.assignee.unassigned")}
            </span>
            {currentAssigneeIds.size === 0 && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </Button>
          {visibleUsersOptions.map((user) => {
            const isSelected = currentAssigneeIds.has(user.value);
            const atMax =
              currentAssigneeIds.size >= MAX_ASSIGNEES && !isSelected;
            return (
              <Button
                key={user.value}
                variant="ghost"
                size="sm"
                className={`w-full justify-start gap-2 h-8 px-2 ${atMax ? "opacity-50" : ""}`}
                onClick={() => handleToggleAssignee(user.value)}
                disabled={atMax}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image ?? ""} alt={user.name || ""} />
                  <AvatarFallback className="text-xs font-medium border border-border/30">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{user.label}</span>
                {isSelected && <Check className="ml-auto h-4 w-4 shrink-0" />}
              </Button>
            );
          })}
          {currentAssigneeIds.size > 0 && (
            <div className="px-2 py-1 text-[10px] text-muted-foreground text-right">
              {currentAssigneeIds.size}/{MAX_ASSIGNEES}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
