import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KbdSequence } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { toastManager } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortcuts } from "@/constants/shortcuts";
import useClearNotifications from "@/hooks/mutations/notification/use-clear-notifications";
import useMarkAllNotificationsAsRead from "@/hooks/mutations/notification/use-mark-all-notifications-as-read";
import useGetNotifications from "@/hooks/queries/notification/use-get-notifications";
import { useRegisterShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import type { Notification } from "@/types/notification";

export type NotificationDropdownRef = {
  toggle: () => void;
};

type NotificationGroup = {
  id: string;
  latest: Notification;
  notifications: Notification[];
  count: number;
  unreadCount: number;
};

function getEventDataRecord(
  eventData: unknown,
): Record<string, unknown> | null {
  if (!eventData || typeof eventData !== "object" || Array.isArray(eventData)) {
    return null;
  }

  return eventData as Record<string, unknown>;
}

function getNotificationGroupKey(notification: Notification) {
  const eventData = getEventDataRecord(notification.eventData);
  const taskId = eventData?.taskId;

  if (
    (notification.type === "task_comment_created" ||
      notification.type === "task_created") &&
    taskId
  ) {
    return `${notification.type}:${String(taskId)}`;
  }

  return notification.id;
}

function groupNotifications(notifications: Notification[]) {
  const groups = new Map<string, NotificationGroup>();

  notifications.forEach((notification) => {
    const key = getNotificationGroupKey(notification);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        id: key,
        latest: notification,
        notifications: [notification],
        count: 1,
        unreadCount: notification.isRead ? 0 : 1,
      });
      return;
    }

    existing.notifications.push(notification);
    existing.count += 1;

    if (!notification.isRead) {
      existing.unreadCount += 1;
    }
  });

  return Array.from(groups.values());
}

function getNotificationTitle(notification: Notification) {
  const eventData = getEventDataRecord(notification.eventData);

  if (notification.type === "task_comment_created") {
    const userName = eventData?.userName;
    return userName ? `${String(userName)} commented` : "New task comment";
  }

  if (notification.type === "task_created") {
    return "New task created";
  }

  return notification.title ?? notification.type;
}

function getNotificationContent(notification: Notification) {
  const eventData = getEventDataRecord(notification.eventData);

  if (notification.type === "task_comment_created" && eventData?.comment) {
    return String(eventData.comment);
  }

  if (notification.type === "task_created" && eventData?.taskTitle) {
    return String(eventData.taskTitle);
  }

  return notification.content ?? "";
}

function getGroupTitle(group: NotificationGroup) {
  if (group.latest.type === "task_comment_created" && group.count > 1) {
    return `${group.count} comments on this task`;
  }

  return getNotificationTitle(group.latest);
}

function getGroupContent(group: NotificationGroup) {
  return getNotificationContent(group.latest);
}

const NotificationDropdown = forwardRef<NotificationDropdownRef>(
  (_props, ref) => {
    const navigate = useNavigate();

    const { data: notifications } = useGetNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const previousNotificationIds = useRef<Set<string> | null>(null);

    const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
    const { mutate: clearAll } = useClearNotifications();

    const unreadNotifications = notifications?.filter((n) => !n.isRead) || [];
    const hasNotifications = notifications && notifications.length > 0;
    const notificationGroups = notifications
      ? groupNotifications(notifications)
      : [];

    const handleNotificationClick = useCallback(
      (notification: Notification) => {
        const eventData = getEventDataRecord(notification.eventData);

        markAllAsRead();
        setIsOpen(false);

        if (
          (notification.type === "task_comment_created" ||
            notification.type === "task_created") &&
          eventData?.taskId
        ) {
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
            params: {
              workspaceId: String(eventData.workspaceId),
              projectId: String(eventData.projectId),
              taskId: String(eventData.taskId),
            },
          });
        }
      },
      [markAllAsRead, navigate],
    );

    useEffect(() => {
      if (!notifications) return;

      if (!previousNotificationIds.current) {
        previousNotificationIds.current = new Set(
          notifications.map((notification) => notification.id),
        );
        return;
      }

      const newNotifications = notifications.filter(
        (notification) =>
          !previousNotificationIds.current?.has(notification.id) &&
          !notification.isRead,
      );

      const newNotificationGroups = groupNotifications(newNotifications);

      newNotificationGroups.forEach((group) => {
        toastManager.add({
          title: getGroupTitle(group),
          description: getGroupContent(group),
          type: "info",
          timeout: 8000,
          actionProps: {
            children: "Open",
            onClick: () => handleNotificationClick(group.latest),
          },
        });
      });

      previousNotificationIds.current = new Set(
        notifications.map((notification) => notification.id),
      );
    }, [notifications, handleNotificationClick]);

    useImperativeHandle(ref, () => ({
      toggle: () => setIsOpen(!isOpen),
    }));

    const handleClearAll = () => {
      clearAll();
      setShowClearDialog(false);
    };

    useRegisterShortcuts({
      sequentialShortcuts: {
        [shortcuts.notification.prefix]: {
          [shortcuts.notification.open]: () => setIsOpen(!isOpen),
        },
      },
    });

    return (
      <>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 p-0"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-2">
                  <KbdSequence
                    keys={[
                      shortcuts.notification.prefix,
                      shortcuts.notification.open,
                    ]}
                  />
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <h3 className="font-medium text-sm">Notifications</h3>

              {unreadNotifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {unreadNotifications.length} new
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      markAllAsRead();
                      setIsOpen(false);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Mark all read
                  </Button>
                </div>
              )}
            </div>

            <div className="relative max-h-96 overflow-y-auto">
              {!hasNotifications ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto h-12 w-12 opacity-50 mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                notificationGroups.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => handleNotificationClick(group.latest)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer",
                      group.unreadCount > 0 && "bg-accent/20",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium">
                            {getGroupTitle(group)}
                          </h4>

                          {group.unreadCount > 0 && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>

                        {getGroupContent(group) && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {getGroupContent(group)}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(group.latest.createdAt)}
                          </p>

                          {group.count > 1 && (
                            <Badge variant="outline" className="text-[10px]">
                              {group.count} updates
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {hasNotifications && (
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                  className="w-full text-xs text-destructive"
                >
                  Clear all notifications
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose>
                <Button variant="outline">Cancel</Button>
              </AlertDialogClose>
              <AlertDialogClose onClick={handleClearAll}>
                <Button variant="destructive">Clear all</Button>
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
);

NotificationDropdown.displayName = "NotificationDropdown";

export default NotificationDropdown;
