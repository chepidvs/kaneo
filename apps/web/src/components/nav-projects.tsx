import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ChevronRight,
  Folder,
  Forward,
  MoreHorizontal,
  Pin,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useDeleteProject from "@/hooks/mutations/project/use-delete-project";
import useGetProjects from "@/hooks/queries/project/use-get-projects";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { usePinnedProjects } from "@/hooks/use-pinned-projects";
import { toast } from "@/lib/toast";
import type { ProjectWithTasks } from "@/types/project";
import CreateProjectModal from "./shared/modals/create-project-modal";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

type ProjectItemProps = {
  project: ProjectWithTasks;
  isActive: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
  onClick: () => void;
  onSettings: () => void;
  onDeleteRequest: () => void;
  isMobile: boolean;
  workspaceId: string;
};

function ProjectItem({
  project,
  isActive,
  isPinned,
  onPinToggle,
  onClick,
  onSettings,
  onDeleteRequest,
  isMobile,
  workspaceId,
}: ProjectItemProps) {
  const { t } = useTranslation();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        size="default"
        className="h-8 gap-0 ps-3.5 text-sm hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-transparent"
        onClick={onClick}
      >
        <span>{project.name}</span>
      </SidebarMenuButton>

      {/* Pin button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPinToggle();
        }}
        title={
          isPinned
            ? t("navigation:projectList.unpinProject")
            : t("navigation:projectList.pinProject")
        }
        className={`absolute top-1.5 right-6 flex aspect-square w-5 items-center justify-center rounded-lg p-0 outline-hidden transition-all after:-inset-2 after:absolute md:after:hidden group-data-[collapsible=icon]:hidden ${
          isPinned
            ? "opacity-100 text-primary hover:bg-sidebar-accent"
            : "opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Pin
          className={`h-3.5 w-3.5 ${isPinned ? "fill-primary stroke-primary" : ""}`}
        />
      </button>

      {/* More options dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-lg p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground after:-inset-2 after:absolute md:after:hidden peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 group-data-[collapsible=icon]:hidden group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0"
            />
          }
        >
          <MoreHorizontal />
          <span className="sr-only">{t("navigation:sidebar.more")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-44 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
        >
          <DropdownMenuItem
            className="h-7 cursor-pointer items-start text-sm"
            onClick={onClick}
          >
            <Folder className="text-muted-foreground" />
            <span>{t("navigation:projectList.viewProject")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-7 cursor-pointer items-start text-sm"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/dashboard/workspace/${workspaceId}/project/${project.id}`,
              );
              toast.success(t("navigation:projectList.linkCopied"));
            }}
          >
            <Forward className="text-muted-foreground" />
            <span>{t("navigation:projectList.shareProject")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-7 cursor-pointer items-start text-sm"
            onClick={onSettings}
          >
            <Settings className="text-muted-foreground" />
            <span>{t("navigation:projectList.projectSettings")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="h-7 cursor-pointer items-start text-sm text-destructive"
            onClick={onDeleteRequest}
          >
            <Trash2 className="text-destructive" />
            <span>{t("navigation:projectList.deleteProject")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export function NavProjects() {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();
  const { data: workspace } = useActiveWorkspace();
  const { data: projects } = useGetProjects({
    workspaceId: workspace?.id || "",
  });
  const queryClient = useQueryClient();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const navigate = useNavigate();
  const { workspaceId: currentWorkspaceId, projectId: currentProjectId } =
    useParams({ strict: false });

  const { isPinned, togglePin } = usePinnedProjects(workspace?.id || "");

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] =
    useState(false);
  const [projectToDeleteId, setProjectToDeleteID] = useState<string | null>(
    null,
  );

  const isCurrentProject = (projectId: string) =>
    currentProjectId === projectId && currentWorkspaceId === workspace?.id;

  const handleProjectClick = (project: ProjectWithTasks) => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
      params: {
        workspaceId: workspace?.id || "",
        projectId: project.id,
      },
    });
  };

  const handleSettings = (project: ProjectWithTasks) => {
    navigate({
      to: "/dashboard/settings/projects/$projectId/general",
      params: { projectId: project.id },
    });
  };

  const sortedProjects = (projects ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const pinnedProjects = sortedProjects.filter((p) => isPinned(p.id));

  if (!workspace) return null;

  return (
    <>
      {/* Favourites section — always visible */}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden gap-1 p-2 pb-0 pt-1">
        <SidebarGroupLabel className="h-7 px-0 text-sidebar-accent-foreground">
          {t("navigation:projectList.favourites")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {pinnedProjects.length === 0 ? (
              <p className="px-3.5 py-1 text-xs italic text-muted-foreground/60">
                {t("navigation:projectList.noFavourites")}
              </p>
            ) : (
              pinnedProjects.map((project) => (
                <ProjectItem
                  key={`fav-${project.id}`}
                  project={project}
                  isActive={isCurrentProject(project.id)}
                  isPinned={true}
                  onPinToggle={() => togglePin(project.id)}
                  onClick={() => handleProjectClick(project)}
                  onSettings={() => handleSettings(project)}
                  onDeleteRequest={() => {
                    setProjectToDeleteID(project.id);
                    setIsDeleteProjectModalOpen(true);
                  }}
                  isMobile={isMobile}
                  workspaceId={workspace.id}
                />
              ))
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Projects section — collapsible */}
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup className="group-data-[collapsible=icon]:hidden gap-1 p-2 pt-1">
          <CollapsibleTrigger
            className="data-panel-open:[&_svg]:rotate-90"
            render={
              <SidebarGroupLabel className="h-7 cursor-pointer justify-between px-0 text-sidebar-accent-foreground" />
            }
          >
            <span>{t("navigation:sidebar.projects")}</span>
            <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/60 transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {sortedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isActive={isCurrentProject(project.id)}
                    isPinned={isPinned(project.id)}
                    onPinToggle={() => togglePin(project.id)}
                    onClick={() => handleProjectClick(project)}
                    onSettings={() => handleSettings(project)}
                    onDeleteRequest={() => {
                      setProjectToDeleteID(project.id);
                      setIsDeleteProjectModalOpen(true);
                    }}
                    isMobile={isMobile}
                    workspaceId={workspace.id}
                  />
                ))}

                <SidebarMenuItem className="mt-1">
                  <SidebarMenuButton
                    size="default"
                    className="h-8 gap-1.5 ps-3.5 text-sm text-muted-foreground hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-transparent"
                    onClick={() => setIsCreateProjectModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">
                      {t("navigation:projectList.addProject")}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsiblePanel>
        </SidebarGroup>
      </Collapsible>

      <CreateProjectModal
        open={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
      />

      <AlertDialog
        open={isDeleteProjectModalOpen}
        onOpenChange={setIsDeleteProjectModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("navigation:projectList.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("navigation:projectList.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>
              <Button variant="outline" size="sm">
                {t("common:actions.cancel")}
              </Button>
            </AlertDialogClose>
            <AlertDialogClose
              onClick={async () => {
                await deleteProject({
                  id: projectToDeleteId || "",
                });
                toast.success(t("navigation:projectList.deletedToast"));
                queryClient.invalidateQueries({
                  queryKey: ["projects"],
                });
                navigate({
                  to: "/dashboard/workspace/$workspaceId",
                  params: {
                    workspaceId: workspace?.id || "",
                  },
                });
              }}
            >
              <Button variant="destructive" size="sm">
                {t("navigation:projectList.deleteProject")}
              </Button>
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
