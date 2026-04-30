import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText } from "lucide-react";
import { MarkdownRenderer } from "@/components/public-project/markdown-renderer";
import { useGetPublicPage } from "@/hooks/queries/page/use-get-public-page";

export const Route = createFileRoute("/public/page/$pageId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  const { data: page, isLoading, isError } = useGetPublicPage(pageId);

  return (
    <main className="h-svh w-full overflow-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-6 py-10">
        <div className="mb-10 flex items-center gap-2 text-muted-foreground text-sm">
          <BookOpenText className="size-4" />
          Public page
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-12 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-64 animate-pulse rounded-md bg-muted/60" />
          </div>
        ) : isError || !page ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="font-semibold text-2xl">Page not available</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              This page is private or does not exist.
            </p>
          </div>
        ) : (
          <article className="kaneo-page-document">
            <h1 className="mb-8 font-heading font-semibold text-5xl">
              {page.title}
            </h1>
            <MarkdownRenderer content={page.content} />
          </article>
        )}
      </div>
    </main>
  );
}
