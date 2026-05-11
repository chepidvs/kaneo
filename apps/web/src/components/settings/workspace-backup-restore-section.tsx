import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { saveAs } from "file-saver";
import { Download, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useExportWorkspaceBackup from "@/hooks/mutations/workspace/use-export-workspace-backup";
import useRestoreWorkspaceBackup from "@/hooks/mutations/workspace/use-restore-workspace-backup";
import useValidateWorkspaceBackup from "@/hooks/mutations/workspace/use-validate-workspace-backup";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import useCreateWorkspace from "@/hooks/queries/workspace/use-create-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

type WorkspaceBackupValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    workspaceMembers: number;
    projects: number;
    projectMembers: number;
    columns: number;
    labels: number;
    modules: number;
    pages: number;
    tasks: number;
    taskLabels: number;
    taskModules: number;
    taskRelations: number;
    timeEntries: number;
    commentActivities: number;
    assets: number;
  } | null;
  excluded: string[];
  sourceWorkspace: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  } | null;
  unresolvedMembers: string[];
};

export function WorkspaceBackupRestoreSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFileName, setRestoreFileName] = useState("");
  const [restoreWorkspaceName, setRestoreWorkspaceName] = useState("");
  const [restoreBackupPayload, setRestoreBackupPayload] =
    useState<unknown>(null);
  const [restoreValidation, setRestoreValidation] =
    useState<WorkspaceBackupValidationResult | null>(null);

  const { data: workspace } = useActiveWorkspace();
  const { isOwner } = useWorkspacePermission();
  const { mutateAsync: exportWorkspaceBackup, isPending: isExportingBackup } =
    useExportWorkspaceBackup();
  const {
    mutateAsync: validateWorkspaceBackup,
    isPending: isValidatingBackup,
  } = useValidateWorkspaceBackup();
  const { mutateAsync: restoreWorkspaceBackup, isPending: isRestoringBackup } =
    useRestoreWorkspaceBackup();
  const { mutateAsync: createWorkspace, isPending: isCreatingWorkspace } =
    useCreateWorkspace();

  const handleDownloadBackup = useCallback(async () => {
    if (!workspace?.id) return;

    const loadingToast = toast.loading(
      t("settings:workspaceGeneral.backupPreparing"),
    );

    try {
      const backup = await exportWorkspaceBackup(workspace.id);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const slug =
        workspace.slug ||
        workspace.name
          .toLowerCase()
          .replace(/[^a-z0-9._-]+/g, "-")
          .replace(/-{2,}/g, "-")
          .replace(/^-+|-+$/g, "") ||
        "workspace";
      const exportDate = new Date().toISOString().slice(0, 10);

      saveAs(blob, `kaneo-${slug}-backup-${exportDate}.json`);

      toast.dismiss(loadingToast);
      toast.success(t("settings:workspaceGeneral.backupSuccess"));
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceGeneral.backupError"),
      );
    }
  }, [workspace, exportWorkspaceBackup, t]);

  const resetRestoreState = useCallback(() => {
    setIsRestoreModalOpen(false);
    setRestoreFileName("");
    setRestoreWorkspaceName("");
    setRestoreBackupPayload(null);
    setRestoreValidation(null);

    if (restoreFileInputRef.current) {
      restoreFileInputRef.current.value = "";
    }
  }, []);

  const handleRestoreFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setRestoreFileName(file.name);
      let loadingToast: string | undefined;

      try {
        const content = await file.text();
        const parsed = JSON.parse(content) as unknown;
        setRestoreBackupPayload(parsed);

        loadingToast = toast.loading(
          t("settings:workspaceGeneral.restoreValidating"),
        );
        const result = (await validateWorkspaceBackup(
          parsed,
        )) as WorkspaceBackupValidationResult;
        setRestoreValidation(result);

        if (result.valid && result.sourceWorkspace?.name) {
          setRestoreWorkspaceName(
            `${result.sourceWorkspace.name} (${t("settings:workspaceGeneral.restoreWorkspaceSuffix")})`,
          );
          toast.dismiss(loadingToast);
          toast.success(
            t("settings:workspaceGeneral.restoreValidationSuccess"),
          );
        } else {
          toast.dismiss(loadingToast);
          toast.error(
            result.errors[0] ||
              t("settings:workspaceGeneral.restoreValidationError"),
          );
        }
      } catch (error) {
        setRestoreBackupPayload(null);
        setRestoreValidation(null);
        toast.dismiss(loadingToast);
        toast.error(
          error instanceof Error
            ? error.message
            : t("settings:workspaceGeneral.restoreInvalidJson"),
        );
      } finally {
        if (restoreFileInputRef.current) {
          restoreFileInputRef.current.value = "";
        }
      }
    },
    [t, validateWorkspaceBackup],
  );

  const handleRestoreBackup = useCallback(async () => {
    if (
      !restoreBackupPayload ||
      !restoreValidation?.valid ||
      !restoreWorkspaceName.trim()
    ) {
      return;
    }

    let createdWorkspaceId: string | null = null;
    const loadingToast = toast.loading(
      t("settings:workspaceGeneral.restorePreparing"),
    );

    try {
      const createdWorkspace = await createWorkspace({
        name: restoreWorkspaceName.trim(),
        description:
          restoreValidation.sourceWorkspace?.description ?? undefined,
        keepCurrentActiveOrganization: true,
      });
      createdWorkspaceId = createdWorkspace.id;

      await restoreWorkspaceBackup({
        workspaceId: createdWorkspace.id,
        backup: restoreBackupPayload,
      });

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await queryClient.invalidateQueries({
        queryKey: ["active-organization"],
      });

      await authClient.organization.setActive({
        organizationId: createdWorkspace.id,
      });

      toast.dismiss(loadingToast);
      toast.success(t("settings:workspaceGeneral.restoreSuccess"));
      resetRestoreState();

      navigate({
        to: "/dashboard/workspace/$workspaceId",
        params: {
          workspaceId: createdWorkspace.id,
        },
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceGeneral.restoreError"),
      );

      if (createdWorkspaceId) {
        toast.error(t("settings:workspaceGeneral.restorePartialWorkspaceHint"));
      }
    }
  }, [
    createWorkspace,
    navigate,
    queryClient,
    resetRestoreState,
    restoreBackupPayload,
    restoreValidation,
    restoreWorkspaceBackup,
    restoreWorkspaceName,
    t,
  ]);

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-md font-medium">
            {t("settings:workspaceGeneral.backupTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("settings:workspaceGeneral.backupSubtitle")}
          </p>
        </div>

        <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {t("settings:workspaceGeneral.downloadBackup")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceGeneral.downloadBackupDescription")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceGeneral.backupExcludesHint")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup}
                className="gap-1.5"
              >
                {isExportingBackup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("settings:workspaceGeneral.downloadBackup")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsRestoreModalOpen(true)}
                disabled={
                  isValidatingBackup || isRestoringBackup || isCreatingWorkspace
                }
                className="gap-1.5"
              >
                {isValidatingBackup ||
                isRestoringBackup ||
                isCreatingWorkspace ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {t("settings:workspaceGeneral.restoreBackup")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isRestoreModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetRestoreState();
            return;
          }

          setIsRestoreModalOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("settings:workspaceGeneral.restoreDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settings:workspaceGeneral.restoreDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-md border border-border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-medium">
                {t("settings:workspaceGeneral.restoreUploadTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceGeneral.restoreCreatesNewWorkspaceHint")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => restoreFileInputRef.current?.click()}
                  disabled={
                    isValidatingBackup ||
                    isRestoringBackup ||
                    isCreatingWorkspace
                  }
                  className="gap-1.5"
                >
                  {isValidatingBackup ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {t("settings:workspaceGeneral.restoreSelectFile")}
                </Button>
                {restoreFileName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {restoreFileName}
                  </span>
                )}
              </div>
              <input
                ref={restoreFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFileChange}
                className="hidden"
              />
            </div>

            {restoreValidation && (
              <div className="space-y-4">
                {restoreValidation.sourceWorkspace && (
                  <div className="rounded-md border border-border p-4 space-y-2">
                    <p className="text-sm font-medium">
                      {t("settings:workspaceGeneral.restoreSourceWorkspace")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {restoreValidation.sourceWorkspace.name}
                    </p>
                  </div>
                )}

                {restoreValidation.summary && (
                  <div className="rounded-md border border-border p-4 space-y-3">
                    <p className="text-sm font-medium">
                      {t("settings:workspaceGeneral.restoreSummaryTitle")}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                      <div>
                        {t(
                          "settings:workspaceGeneral.restoreSummaryWorkspaceMembers",
                          {
                            count: restoreValidation.summary.workspaceMembers,
                          },
                        )}
                      </div>
                      <div>
                        {t("settings:workspaceGeneral.restoreSummaryProjects", {
                          count: restoreValidation.summary.projects,
                        })}
                      </div>
                      <div>
                        {t("settings:workspaceGeneral.restoreSummaryTasks", {
                          count: restoreValidation.summary.tasks,
                        })}
                      </div>
                      <div>
                        {t("settings:workspaceGeneral.restoreSummaryPages", {
                          count: restoreValidation.summary.pages,
                        })}
                      </div>
                      <div>
                        {t("settings:workspaceGeneral.restoreSummaryComments", {
                          count: restoreValidation.summary.commentActivities,
                        })}
                      </div>
                      <div>
                        {t(
                          "settings:workspaceGeneral.restoreSummaryTimeEntries",
                          {
                            count: restoreValidation.summary.timeEntries,
                          },
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {restoreValidation.errors.length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                    <p className="text-sm font-medium text-destructive">
                      {t("settings:workspaceGeneral.restoreErrorsTitle")}
                    </p>
                    <ul className="list-disc pl-5 text-xs text-destructive space-y-1">
                      {restoreValidation.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {restoreValidation.warnings.length > 0 && (
                  <div className="rounded-md border border-border p-4 space-y-2">
                    <p className="text-sm font-medium">
                      {t("settings:workspaceGeneral.restoreWarningsTitle")}
                    </p>
                    <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                      {restoreValidation.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {restoreValidation.excluded.length > 0 && (
                  <div className="rounded-md border border-border p-4 space-y-2">
                    <p className="text-sm font-medium">
                      {t("settings:workspaceGeneral.restoreExcludedTitle")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {restoreValidation.excluded.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings:workspaceGeneral.restoreWorkspaceNameLabel")}
                  </p>
                  <Input
                    value={restoreWorkspaceName}
                    onChange={(event) =>
                      setRestoreWorkspaceName(event.target.value)
                    }
                    placeholder={t(
                      "settings:workspaceGeneral.restoreWorkspaceNamePlaceholder",
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={resetRestoreState}
              disabled={isRestoringBackup || isCreatingWorkspace}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={handleRestoreBackup}
              disabled={
                !restoreValidation?.valid ||
                !restoreWorkspaceName.trim() ||
                isRestoringBackup ||
                isCreatingWorkspace
              }
              className="gap-1.5"
            >
              {isRestoringBackup || isCreatingWorkspace ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {t("settings:workspaceGeneral.restoreConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WorkspaceBackupRestoreSection;
