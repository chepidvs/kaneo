import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  BookOpenText,
  ExternalLink,
  Globe2,
  Link2,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { useCreatePage } from "@/hooks/mutations/page/use-create-page";
import { useDeletePage } from "@/hooks/mutations/page/use-delete-page";
import { useUpdatePage } from "@/hooks/mutations/page/use-update-page";
import { useGetPagesByProject } from "@/hooks/queries/page/use-get-pages-by-project";
import { toast } from "@/lib/toast";
import type Page from "@/types/page";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/pages",
)({
  component: RouteComponent,
});

const skeletonRows = [
  "page-skeleton-one",
  "page-skeleton-two",
  "page-skeleton-three",
  "page-skeleton-four",
];

function getEditorUrl({
  workspaceId,
  projectId,
  pageId,
}: {
  workspaceId: string;
  projectId: string;
  pageId: string;
}) {
  return `/dashboard/workspace/${workspaceId}/project/${projectId}/pages/${pageId}`;
}

function getAbsoluteEditorUrl({
  workspaceId,
  projectId,
  pageId,
}: {
  workspaceId: string;
  projectId: string;
  pageId: string;
}) {
  return `${window.location.origin}${getEditorUrl({
    workspaceId,
    projectId,
    pageId,
  })}`;
}

function getPublicPageUrl(pageId: string) {
  return `${window.location.origin}/public/page/${pageId}`;
}

function RouteComponent() {
  const { workspaceId, projectId } = Route.useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: pages = [], isLoading } = useGetPagesByProject(projectId);
  const { mutateAsync: createPage, isPending: isCreatingPage } =
    useCreatePage();
  const { mutateAsync: deletePage } = useDeletePage();
  const { mutateAsync: updatePage } = useUpdatePage();

  const handleCreateClick = async () => {
    try {
      const createdPage = await createPage({
        projectId,
        data: {
          title: "Untitled",
          slug: `untitled-${Date.now()}`,
          content: "",
          isPublic: false,
        },
      });

      navigate({
        to: "/dashboard/workspace/$workspaceId/project/$projectId/pages/$pageId",
        params: { workspaceId, projectId, pageId: createdPage.id },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create page",
      );
    }
  };

  const handleOpenPage = (page: Page) => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/pages/$pageId",
      params: { workspaceId, projectId, pageId: page.id },
    });
  };

  const handleOpenNewTab = (page: Page) => {
    window.open(
      getAbsoluteEditorUrl({ workspaceId, projectId, pageId: page.id }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleCopyLink = async (page: Page) => {
    const link = page.isPublic
      ? getPublicPageUrl(page.id)
      : getAbsoluteEditorUrl({ workspaceId, projectId, pageId: page.id });

    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  const handleTogglePublic = async (page: Page) => {
    try {
      await updatePage({
        id: page.id,
        data: { isPublic: !page.isPublic },
      });
      toast.success(page.isPublic ? "Page is private" : "Page is public");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update page",
      );
    }
  };

  const handleDeletePage = async (page: Page) => {
    if (!window.confirm(`Delete page "${page.title}"?`)) return;

    try {
      await deletePage(page.id);
      toast.success("Page deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete page",
      );
    }
  };

  const pagesPath = `/dashboard/workspace/${workspaceId}/project/${projectId}/pages`;

  if (location.pathname !== pagesPath) {
    return <Outlet />;
  }

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="pages"
      headerActions={
        <Button
          size="sm"
          className="h-7 gap-1.5"
          onClick={handleCreateClick}
          disabled={isCreatingPage}
        >
          <Plus className="size-3.5" />
          Page
        </Button>
      }
    >
      <PageTitle title="Pages" hideAppName />
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h1 className="font-semibold text-lg">Pages</h1>
          <p className="text-muted-foreground text-sm">
            Project articles and knowledge base notes.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {skeletonRows.map((key) => (
                <div
                  key={key}
                  className="h-20 animate-pulse rounded-md border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <BookOpenText className="mb-3 size-8 text-muted-foreground" />
                <EmptyTitle>No pages yet</EmptyTitle>
                <EmptyDescription>
                  Create a page for project notes or knowledge base content.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={handleCreateClick} disabled={isCreatingPage}>
                <Plus className="size-4" />
                Page
              </Button>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between gap-3 border-border border-b px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpenText className="size-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => handleOpenPage(page)}
                        className="truncate font-medium text-sm text-left hover:underline"
                      >
                        {page.title}
                      </button>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-muted-foreground text-xs">
                        {page.isPublic ? (
                          <Globe2 className="size-3" />
                        ) : (
                          <Lock className="size-3" />
                        )}
                        {page.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-muted-foreground text-xs">
                      /{page.slug}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Open actions for ${page.title}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleOpenNewTab(page)}>
                        <ExternalLink className="size-4" />
                        Open in new tab
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(page)}>
                        <Link2 className="size-4" />
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTogglePublic(page)}
                      >
                        {page.isPublic ? (
                          <Lock className="size-4" />
                        ) : (
                          <Globe2 className="size-4" />
                        )}
                        {page.isPublic ? "Make private" : "Make public"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeletePage(page)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
}
