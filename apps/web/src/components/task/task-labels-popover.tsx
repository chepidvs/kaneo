import { Check, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useAttachLabelToTask from "@/hooks/mutations/label/use-attach-label-to-task";
import useCreateLabel from "@/hooks/mutations/label/use-create-label";
import useDetachLabelFromTask from "@/hooks/mutations/label/use-detach-label-from-task";
import useGetLabelsByProject from "@/hooks/queries/label/use-get-labels-by-project";
import useGetLabelsByTask from "@/hooks/queries/label/use-get-labels-by-task";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

const labelColors = [
  { value: "gray", key: "stone", color: "var(--color-stone-500)" },
  { value: "dark-gray", key: "slate", color: "var(--color-slate-500)" },
  { value: "purple", key: "lavender", color: "var(--color-violet-500)" },
  { value: "teal", key: "sage", color: "var(--color-emerald-600)" },
  { value: "green", key: "forest", color: "var(--color-green-600)" },
  { value: "yellow", key: "amber", color: "var(--color-amber-600)" },
  { value: "orange", key: "terracotta", color: "var(--color-orange-600)" },
  { value: "pink", key: "rose", color: "var(--color-rose-600)" },
  { value: "red", key: "crimson", color: "var(--color-red-600)" },
] as const;

type LabelColor =
  | "gray"
  | "dark-gray"
  | "purple"
  | "teal"
  | "green"
  | "yellow"
  | "orange"
  | "pink"
  | "red";

type TaskLabelsPopoverProps = {
  task: Task;
  workspaceId: string;
  children: React.ReactNode;
  triggerNativeButton?: boolean;
};

type PopoverStep = "select" | "color";

function normalizeLabelName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export default function TaskLabelsPopover({
  task,
  workspaceId: _workspaceId,
  children,
  triggerNativeButton = true,
}: TaskLabelsPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PopoverStep>("select");
  const [searchValue, setSearchValue] = useState("");
  const [selectedColor, setSelectedColor] = useState<LabelColor>("gray");
  const [newLabelName, setNewLabelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createLabel } = useCreateLabel();
  const { mutateAsync: attachLabel } = useAttachLabelToTask();
  const { mutateAsync: detachLabel } = useDetachLabelFromTask();

  const { data: taskLabels = [] } = useGetLabelsByTask(task.id);
  const { data: projectLabels = [] } = useGetLabelsByProject(task.projectId);

  const assignedLabelIds = useMemo(
    () => new Set(taskLabels.map((label) => label.id)),
    [taskLabels],
  );

  const filteredLabels = useMemo(() => {
    return projectLabels.filter((label) =>
      label.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [projectLabels, searchValue]);

  const normalizedSearchValue = useMemo(
    () => normalizeLabelName(searchValue),
    [searchValue],
  );

  const isCreatingNewLabel = useMemo(
    () =>
      !!normalizedSearchValue &&
      !projectLabels.some(
        (label) =>
          normalizeLabelName(label.name).toLowerCase() ===
          normalizedSearchValue.toLowerCase(),
      ),
    [projectLabels, normalizedSearchValue],
  );

  useEffect(() => {
    if (open && step === "select" && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const resetPopover = () => {
    setStep("select");
    setSearchValue("");
    setNewLabelName("");
    setSelectedColor("gray");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetPopover, 200);
  };

  const handleToggleLabel = async (labelId: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const isCurrentlyAssigned = assignedLabelIds.has(labelId);

      if (isCurrentlyAssigned) {
        await detachLabel({
          id: labelId,
          taskId: task.id,
        });

        toast.success(t("tasks:popover.labels.removeSuccess"));
      } else {
        await attachLabel({
          id: labelId,
          taskId: task.id,
        });

        toast.success(t("tasks:popover.labels.addSuccess"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:popover.labels.updateError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewClick = () => {
    const normalized = normalizeLabelName(searchValue);
    if (!normalized) return;

    setNewLabelName(normalized);
    setStep("color");
  };

  const handleColorSelect = async (color: LabelColor) => {
    if (isSubmitting) return;

    const normalizedName = normalizeLabelName(newLabelName);
    if (!normalizedName) return;

    setSelectedColor(color);
    setIsSubmitting(true);

    try {
      const createdLabel = await createLabel({
        name: normalizedName,
        color,
        projectId: task.projectId,
      });

      await attachLabel({
        id: createdLabel.id,
        taskId: task.id,
      });

      toast.success(t("tasks:popover.labels.createSuccess"));
      handleClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:popover.labels.createError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelectStep = () => (
    <div className="w-auto">
      <div className="flex items-center gap-2 border-b border-border p-2">
        <Search className="h-3 w-3 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={t("tasks:popover.labels.searchPlaceholder")}
          className="h-auto border-none p-0 shadow-none !bg-transparent focus-visible:ring-0"
        />
      </div>

      <div className="py-1">
        {filteredLabels.length === 0 && searchValue.length === 0 && (
          <span className="px-2 text-xs text-muted-foreground">
            {t("tasks:popover.labels.empty")}
          </span>
        )}

        {filteredLabels.map((label) => (
          <button
            key={label.id}
            type="button"
            disabled={isSubmitting}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handleToggleLabel(label.id)}
          >
            <div className="flex w-3 shrink-0 justify-center">
              {assignedLabelIds.has(label.id) && <Check className="h-3 w-3" />}
            </div>

            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  labelColors.find((c) => c.value === label.color)?.color ||
                  "var(--color-neutral-400)",
              }}
            />

            <span className="max-w-20 truncate">{label.name}</span>
          </button>
        ))}

        {isCreatingNewLabel && filteredLabels.length > 0 && (
          <div className="my-1 border-t border-border" />
        )}

        {isCreatingNewLabel && (
          <button
            type="button"
            disabled={isSubmitting}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCreateNewClick}
          >
            <div className="flex w-3 shrink-0 justify-center">
              <Plus className="h-3 w-3" />
            </div>
            <span>Create Label</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderColorStep = () => (
    <div className="w-[220px] p-2">
      <div className="mb-2 text-xs font-medium">
        {t("tasks:popover.labels.chooseColor")}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {labelColors.map((colorOption) => (
          <button
            key={colorOption.value}
            type="button"
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2 py-2 text-xs hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50",
              selectedColor === colorOption.value && "border-primary",
            )}
            onClick={() => handleColorSelect(colorOption.value)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorOption.color }}
            />
            <span className="truncate">
              {t(`common:modals.createTask.labelColors.${colorOption.key}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild={!triggerNativeButton}>{children}</PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        {step === "select" ? renderSelectStep() : renderColorStep()}
      </PopoverContent>
    </Popover>
  );
}
