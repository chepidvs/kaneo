import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, Pencil, Plus, Shapes, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCreateModule } from "@/hooks/mutations/module/use-create-module";
import { useDeleteModule } from "@/hooks/mutations/module/use-delete-module";
import { useUpdateModule } from "@/hooks/mutations/module/use-update-module";
import { useGetModules } from "@/hooks/queries/module/use-get-modules";
import { cn } from "@/lib/cn";
import { formatDateMedium, formatDateShort } from "@/lib/format";
import { toast } from "@/lib/toast";
import type Module from "@/types/module";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/modules",
)({
  component: RouteComponent,
});

type ModuleFormState = {
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
};

const emptyForm: ModuleFormState = {
  name: "",
  description: "",
  startDate: undefined,
  endDate: undefined,
};

const skeletonRows = [
  "module-skeleton-one",
  "module-skeleton-two",
  "module-skeleton-three",
  "module-skeleton-four",
];

function ModuleDateField({
  label,
  value,
  onChange,
  clearLabel,
}: {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  clearLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-medium text-xs transition-colors hover:bg-accent/50",
            value ? "bg-accent/30 text-foreground" : "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{value ? formatDateMedium(value) : label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          className="w-full bg-popover"
        />
        {value && (
          <div className="border-border border-t p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => onChange(undefined)}
            >
              {clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function formatModuleDateRange(module: Module) {
  const startDate = module.startDate ? formatDateShort(module.startDate) : null;
  const endDate = module.endDate ? formatDateShort(module.endDate) : null;

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) {
    return `Starts ${startDate}`;
  }

  if (endDate) {
    return `Ends ${endDate}`;
  }

  return null;
}

function RouteComponent() {
  const { workspaceId, projectId } = Route.useParams();
  const { data: modules = [], isLoading } = useGetModules(projectId);
  const { mutateAsync: createModule } = useCreateModule();
  const { mutateAsync: updateModule } = useUpdateModule();
  const { mutateAsync: deleteModule } = useDeleteModule();
  const [open, setOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [form, setForm] = useState<ModuleFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetDialog = () => {
    setOpen(false);
    setEditingModule(null);
    setForm(emptyForm);
    setIsSubmitting(false);
  };

  const handleCreateClick = () => {
    setEditingModule(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const handleEditClick = (module: Module) => {
    setEditingModule(module);
    setForm({
      name: module.name,
      description: module.description ?? "",
      startDate: module.startDate ? new Date(module.startDate) : undefined,
      endDate: module.endDate ? new Date(module.endDate) : undefined,
    });
    setOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name || isSubmitting) return;

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error("End date must not be earlier than start date");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingModule) {
        await updateModule({
          id: editingModule.id,
          data: {
            name,
            description: form.description.trim() || null,
            startDate: form.startDate?.toISOString() ?? null,
            endDate: form.endDate?.toISOString() ?? null,
          },
        });
        toast.success("Module updated");
      } else {
        await createModule({
          projectId,
          data: {
            name,
            description: form.description.trim() || undefined,
            startDate: form.startDate?.toISOString(),
            endDate: form.endDate?.toISOString(),
          },
        });
        toast.success("Module created");
      }
      resetDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save module",
      );
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (module: Module) => {
    if (!window.confirm(`Delete module "${module.name}"?`)) return;

    try {
      await deleteModule(module.id);
      toast.success("Module deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete module",
      );
    }
  };

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="modules"
      headerActions={
        <Button size="sm" className="h-7 gap-1.5" onClick={handleCreateClick}>
          <Plus className="size-3.5" />
          Module
        </Button>
      }
    >
      <PageTitle title="Modules" hideAppName />
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h1 className="font-semibold text-lg">Modules</h1>
          <p className="text-muted-foreground text-sm">
            Group tasks by campaign, phase, or release.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {skeletonRows.map((key) => (
                <div
                  key={key}
                  className="h-16 animate-pulse rounded-md border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <Shapes className="mb-3 size-8 text-muted-foreground" />
                <EmptyTitle>No modules yet</EmptyTitle>
                <EmptyDescription>
                  Create a module to group related tasks.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={handleCreateClick}>
                <Plus className="size-4" />
                Module
              </Button>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              {modules.map((module) => {
                const dateRange = formatModuleDateRange(module);

                return (
                  <div
                    key={module.id}
                    className="flex items-center justify-between gap-3 border-border border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Shapes className="size-4 text-muted-foreground" />
                        <button
                          type="button"
                          className="truncate text-left font-medium text-sm hover:underline"
                          onClick={() => handleEditClick(module)}
                        >
                          {module.name}
                        </button>
                      </div>
                      {dateRange && (
                        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
                          <CalendarIcon className="size-3.5" />
                          {dateRange}
                        </p>
                      )}
                      {module.description && (
                        <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(module)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(module)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => !nextOpen && resetDialog()}
      >
        <DialogContent
          bottomStickOnMobile={false}
          className="max-h-[calc(100vh-2rem)] overflow-hidden"
        >
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit}
          >
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Edit module" : "Create module"}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pt-1 pb-3">
              <div className="space-y-1.5">
                <label className="font-medium text-sm" htmlFor="module-name">
                  Title
                </label>
                <Input
                  id="module-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Module title"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="font-medium text-sm"
                  htmlFor="module-description"
                >
                  Description
                </label>
                <Textarea
                  id="module-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <p className="font-medium text-sm">Dates</p>
                <div className="flex flex-wrap items-center gap-2">
                  <ModuleDateField
                    label="Start date"
                    value={form.startDate}
                    onChange={(date) =>
                      setForm((current) => ({
                        ...current,
                        startDate: date,
                      }))
                    }
                    clearLabel="Clear start date"
                  />
                  <ModuleDateField
                    label="End date"
                    value={form.endDate}
                    onChange={(date) =>
                      setForm((current) => ({
                        ...current,
                        endDate: date,
                      }))
                    }
                    clearLabel="Clear end date"
                  />
                </div>
              </div>
            </div>
            <DialogFooter
              variant="bare"
              className="shrink-0 border-t px-6 pt-4"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={resetDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
              >
                {editingModule ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
