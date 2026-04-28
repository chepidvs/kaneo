import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useAddProjectMember from "@/hooks/mutations/project/use-add-project-member";
import useRemoveProjectMember from "@/hooks/mutations/project/use-remove-project-member";
import useUpdateProject from "@/hooks/mutations/project/use-update-project";
import useGetProject from "@/hooks/queries/project/use-get-project";
import useGetProjectMembers from "@/hooks/queries/project/use-get-project-members";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import useGetWorkspaceUsers from "@/hooks/queries/workspace-users/use-get-workspace-users";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/projects/$projectId/visibility",
)({
  component: RouteComponent,
});

type WorkspaceMember = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string | null;
};

type ProjectMember = WorkspaceMember & {
  projectMemberId?: string;
};

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { data: workspace } = useActiveWorkspace();
  const { isOwner } = useWorkspacePermission();

  const resolvedProjectId = projectId || "";
  const workspaceId = workspace?.id || "";

  const { data: project } = useGetProject({
    id: resolvedProjectId,
    workspaceId,
  });

  const { data: workspaceUsers = [] } = useGetWorkspaceUsers({
    workspaceId,
  });

  const { data: projectMembers = [] } = useGetProjectMembers(resolvedProjectId);

  const queryClient = useQueryClient();
  const { mutateAsync: updateProject } = useUpdateProject();

  const { mutateAsync: addProjectMember, isPending: isAddingMember } =
    useAddProjectMember(resolvedProjectId);

  const { mutateAsync: removeProjectMember, isPending: isRemovingMember } =
    useRemoveProjectMember(resolvedProjectId);

  const savingRef = useRef(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const projectMemberIds = useMemo(() => {
    return new Set(
      (projectMembers as ProjectMember[]).map((member) => member.id),
    );
  }, [projectMembers]);

  const availableMembers = useMemo(() => {
    return (workspaceUsers as WorkspaceMember[]).filter(
      (member) => !projectMemberIds.has(member.id),
    );
  }, [workspaceUsers, projectMemberIds]);

  const handleToggle = useCallback(async () => {
    if (!project) return;
    if (savingRef.current) return;

    savingRef.current = true;

    try {
      await updateProject({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description || "",
        icon: project.icon || "Layout",
        isPublic: !project.isPublic,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({
          queryKey: ["projects", workspace?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projects", workspace?.id, project.id],
        }),
      ]);

      toast.success(t("settings:projectVisibility.toastUpdated"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("settings:projectVisibility.toastUpdateError"),
      );
    } finally {
      savingRef.current = false;
    }
  }, [project, updateProject, queryClient, workspace?.id, t]);

  const handleAddMember = useCallback(async () => {
    if (!resolvedProjectId || !selectedUserId) return;

    try {
      await addProjectMember({
        projectId: resolvedProjectId,
        userId: selectedUserId,
        role: "member",
      });

      setSelectedUserId("");
      toast.success("Project member added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add member");
    }
  }, [addProjectMember, resolvedProjectId, selectedUserId]);

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      if (!resolvedProjectId || !userId) return;

      try {
        await removeProjectMember({
          projectId: resolvedProjectId,
          userId,
        });

        toast.success("Project member removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove member");
      }
    },
    [removeProjectMember, resolvedProjectId],
  );

  const origin = window.location.origin;
  const publicUrl = project?.id ? `${origin}/public-project/${project.id}` : "";

  return (
    <>
      <PageTitle title={t("settings:projectVisibility.pageTitle")} />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:projectVisibility.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:projectVisibility.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:projectVisibility.sectionTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:projectVisibility.sectionSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:projectVisibility.publicAccess")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:projectVisibility.publicAccessHint")}
                </p>
              </div>

              <Switch
                checked={!!project?.isPublic}
                onCheckedChange={handleToggle}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:projectVisibility.publicUrl")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:projectVisibility.publicUrlHint")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input readOnly value={publicUrl} className="w-96" />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!publicUrl) return;

                    navigator.clipboard
                      .writeText(publicUrl)
                      .then(() =>
                        toast.success(
                          t("settings:projectVisibility.copiedToast"),
                        ),
                      );
                  }}
                >
                  {t("settings:projectVisibility.copy")}
                </Button>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
              <div className="space-y-1">
                <h2 className="text-md font-medium">Project Access</h2>
                <p className="text-xs text-muted-foreground">
                  Manage which workspace members can access this private
                  project. Workspace owner/admin can still access all projects.
                </p>
              </div>

              <Separator />

              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Add member</Label>
                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select workspace member</option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email} —{" "}
                        {member.role || "member"}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  size="sm"
                  disabled={!selectedUserId || isAddingMember}
                  onClick={handleAddMember}
                >
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Allowed members</Label>

                {(projectMembers as ProjectMember[]).length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No project-specific members yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(projectMembers as ProjectMember[]).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email} · {member.role || "member"}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRemovingMember}
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default RouteComponent;
