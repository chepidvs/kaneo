import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Paperclip } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CommentEditor from "@/components/activity/comment-editor";
import { Button } from "@/components/ui/button";
import { KbdSequence } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useCreateComment from "@/hooks/mutations/comment/use-create-comment";
import useGetWorkspaceUsers from "@/hooks/queries/workspace-users/use-get-workspace-users";
import { getModifierKeyText } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

type CommentInputProps = {
  taskId: string;
  workspaceId: string;
};

type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeMentionName(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export default function CommentInput({
  taskId,
  workspaceId,
}: CommentInputProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [attachAction, setAttachAction] = useState<(() => void) | null>(null);
  const { mutateAsync: createComment, isPending } = useCreateComment();
  const queryClient = useQueryClient();

  const { data: workspaceUsers } = useGetWorkspaceUsers({ workspaceId });

  const mentionableMembers = useMemo<WorkspaceMember[]>(() => {
    if (!Array.isArray(workspaceUsers)) {
      return [];
    }

    return workspaceUsers.filter(
      (member): member is WorkspaceMember =>
        typeof member === "object" &&
        member !== null &&
        "id" in member &&
        typeof (member as WorkspaceMember).id === "string",
    );
  }, [workspaceUsers]);

  const mentionedUserIds = useMemo<string[]>(() => {
    if (!content.trim() || mentionableMembers.length === 0) {
      return [];
    }

    const normalizedContent = content.toLowerCase();

    return Array.from(
      new Set(
        mentionableMembers
          .filter((member) => {
            const mentionNames = [member.username, member.name]
              .filter((value): value is string => Boolean(value?.trim()))
              .map(normalizeMentionName);

            return mentionNames.some((mentionName) => {
              const mentionPattern = new RegExp(
                `(^|\\s)@${escapeRegExp(mentionName)}(?=\\s|$|[.,!?;:])`,
                "i",
              );

              return mentionPattern.test(normalizedContent);
            });
          })
          .map((member) => member.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
  }, [content, mentionableMembers]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      toast.error(t("activity:comment.cannotBeEmpty"));
      return;
    }

    try {
      await createComment({
        taskId,
        comment: content,
        mentions: mentionedUserIds,
      });

      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["activities", taskId] });

      toast.success(t("activity:comment.added"));
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast.error(t("activity:comment.failedToAdd"));
    }
  }, [content, createComment, mentionedUserIds, queryClient, t, taskId]);

  const handleAttachActionChange = useCallback(
    (nextAttachAction: (() => void) | null) => {
      setAttachAction(() => nextAttachAction);
    },
    [],
  );

  return (
    <div className="w-full">
      <div className="rounded-xl border border-border/80 bg-card/70 transition-colors focus-within:border-ring/60 focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--ring)_20%,transparent)]">
        <CommentEditor
          value={content}
          onChange={setContent}
          mentionableMembers={mentionableMembers}
          placeholder={t("activity:comment.leavePlaceholder")}
          taskId={taskId}
          uploadSurface="comment"
          showQuickAttachButton={false}
          onAttachActionChange={handleAttachActionChange}
          className="[&_.kaneo-comment-editor-content_.ProseMirror]:min-h-[3rem] [&_.kaneo-comment-editor-content_.ProseMirror]:max-h-none [&_.kaneo-comment-editor-content_.ProseMirror]:overflow-visible [&_.kaneo-comment-editor-content_.ProseMirror]:px-3 [&_.kaneo-comment-editor-content_.ProseMirror]:pt-3 [&_.kaneo-comment-editor-content_.ProseMirror]:pb-2"
          onSubmitShortcut={handleSubmit}
        />
        <div className="flex items-center justify-end gap-2 border-border/70 border-t px-2 py-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => attachAction?.()}
            disabled={!attachAction}
            className="text-muted-foreground"
            aria-label={t("activity:comment.attachFile")}
          >
            <Paperclip className="size-3.5" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="xs"
                  variant="default"
                  onClick={handleSubmit}
                  disabled={isPending || !content.trim()}
                  className={cn(
                    isPending ||
                      (!content.trim() && "opacity-50 cursor-not-allowed"),
                    content.trim().length > 0 &&
                      "bg-primary text-primary-foreground",
                  )}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <KbdSequence
                  keys={[getModifierKeyText(), "Enter"]}
                  description={t("activity:comment.submitShortcut")}
                />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
