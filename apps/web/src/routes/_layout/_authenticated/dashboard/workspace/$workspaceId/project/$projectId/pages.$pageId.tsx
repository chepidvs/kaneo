import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, Check, ExternalLink, Globe2, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CommentEditor from "@/components/activity/comment-editor";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpdatePage } from "@/hooks/mutations/page/use-update-page";
import { useGetPage } from "@/hooks/queries/page/use-get-page";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/pages/$pageId",
)({
  component: RouteComponent,
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPublicPageUrl(pageId: string) {
  return `${window.location.origin}/public/page/${pageId}`;
}

function RouteComponent() {
  const { workspaceId, projectId, pageId } = Route.useParams();
  const navigate = useNavigate();
  const { data: page, isLoading } = useGetPage(pageId);
  const { mutateAsync: updatePage, isPending } = useUpdatePage();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setIsPublic(page.isPublic);
  }, [page]);

  const isDirty = useMemo(() => {
    if (!page) return false;
    return (
      title !== page.title ||
      slug !== page.slug ||
      content !== page.content ||
      isPublic !== page.isPublic
    );
  }, [content, isPublic, page, slug, title]);

  const handleSave = async () => {
    const nextTitle = title.trim() || "Untitled";
    const nextSlug = slug.trim() || slugify(nextTitle) || pageId;

    try {
      await updatePage({
        id: pageId,
        data: {
          title: nextTitle,
          slug: nextSlug,
          content,
          isPublic,
        },
      });
      toast.success("Page saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save page",
      );
    }
  };

  const handleOpenPublic = () => {
    window.open(getPublicPageUrl(pageId), "_blank", "noopener,noreferrer");
  };

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="pages"
      headerActions={
        <div className="flex items-center gap-1.5">
          <div className="flex h-7 items-center gap-2 rounded-md border border-border px-2 text-xs">
            {isPublic ? (
              <Globe2 className="size-3.5 text-muted-foreground" />
            ) : (
              <Lock className="size-3.5 text-muted-foreground" />
            )}
            <span>{isPublic ? "Public" : "Private"}</span>
            <Switch
              aria-label="Public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="[--thumb-size:--spacing(3)]"
            />
          </div>
          {isPublic && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5"
              onClick={handleOpenPublic}
            >
              <ExternalLink className="size-3.5" />
              Public link
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 gap-1.5"
            onClick={handleSave}
            disabled={isPending || !isDirty}
          >
            <Check className="size-3.5" />
            Save
          </Button>
        </div>
      }
    >
      <PageTitle title={page?.title ?? "Page"} hideAppName />
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        <div className="flex min-h-0 flex-1 justify-center overflow-auto">
          <main className="flex min-h-full w-full max-w-5xl flex-col px-8 py-8">
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/dashboard/workspace/$workspaceId/project/$projectId/pages",
                  params: { workspaceId, projectId },
                })
              }
              className="mb-8 flex w-fit items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
            >
              <BookOpenText className="size-4" />
              Pages
            </button>

            {isLoading ? (
              <div className="space-y-4">
                <div className="h-12 w-2/3 animate-pulse rounded-md bg-muted" />
                <div className="h-80 animate-pulse rounded-md bg-muted/60" />
              </div>
            ) : (
              <>
                <input
                  value={title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setTitle(nextTitle);
                    if (!page || page.title === "Untitled") {
                      setSlug(slugify(nextTitle));
                    }
                  }}
                  placeholder="Untitled"
                  className="mb-2 w-full bg-transparent font-heading font-semibold text-5xl outline-none placeholder:text-muted-foreground"
                />
                <input
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder="page-slug"
                  className="mb-8 w-full bg-transparent text-muted-foreground text-sm outline-none placeholder:text-muted-foreground/70"
                />
                <CommentEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Press '/' for commands..."
                  showQuickAttachButton={false}
                  uploadSurface="description"
                  className="min-h-[calc(100vh-15rem)] border-none bg-transparent"
                  contentClassName="kaneo-tiptap-content kaneo-page-editor-content"
                  proseClassName="kaneo-tiptap-prose"
                />
              </>
            )}
          </main>
        </div>
      </div>
    </ProjectLayout>
  );
}
