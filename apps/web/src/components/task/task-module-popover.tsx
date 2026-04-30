import { Check, CircleDashed, Search, Shapes } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateTask } from "@/hooks/mutations/task/use-update-task";
import { useGetModules } from "@/hooks/queries/module/use-get-modules";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

type TaskModulePopoverProps = {
  task: Task;
  children: React.ReactNode;
  triggerNativeButton?: boolean;
};

export default function TaskModulePopover({
  task,
  children,
  triggerNativeButton = true,
}: TaskModulePopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: modules = [] } = useGetModules(task.projectId);
  const { mutateAsync: updateTask } = useUpdateTask();

  const filteredModules = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return modules;

    return modules.filter((module) =>
      module.name.toLowerCase().includes(normalizedSearch),
    );
  }, [modules, searchValue]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSelectModule = async (moduleId: string | null) => {
    if (isSubmitting || task.moduleId === moduleId) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateTask({
        ...task,
        moduleId,
      });
      toast.success("Module updated");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update module",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger nativeButton={triggerNativeButton} render={children} />
      <PopoverContent align="start" className="w-56 p-0">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <Search className="h-3 w-3 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search modules"
            className="h-auto border-none p-0 shadow-none !bg-transparent focus-visible:ring-0"
          />
        </div>

        <div className="py-1">
          <button
            type="button"
            disabled={isSubmitting}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handleSelectModule(null)}
          >
            <div className="flex w-3 shrink-0 justify-center">
              {!task.moduleId && <Check className="h-3 w-3" />}
            </div>
            <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
            <span>No module</span>
          </button>

          {filteredModules.map((module) => (
            <button
              key={module.id}
              type="button"
              disabled={isSubmitting}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => handleSelectModule(module.id)}
            >
              <div className="flex w-3 shrink-0 justify-center">
                {task.moduleId === module.id && <Check className="h-3 w-3" />}
              </div>
              <Shapes
                className={cn(
                  "h-3.5 w-3.5",
                  task.moduleId === module.id
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="truncate">{module.name}</span>
            </button>
          ))}

          {filteredModules.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {t("common:empty.noResults", "No results")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
