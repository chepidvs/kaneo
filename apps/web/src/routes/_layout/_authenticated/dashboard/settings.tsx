import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useGetProjects from "@/hooks/queries/project/use-get-projects";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings",
)({
  component: SettingsLayout,
});

function SettingsLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: workspace } = useActiveWorkspace();
  const { data: projects } = useGetProjects({
    workspaceId: workspace?.id ?? "",
  });

  const getActiveTab = () => {
    const pathname = location.pathname;
    if (pathname.includes("/dashboard/settings/account")) {
      return "account";
    }
    if (pathname.includes("/dashboard/settings/workspace")) {
      return "workspace";
    }
    if (pathname.includes("/dashboard/settings/projects")) {
      return "project";
    }
    return "account";
  };

  const activeTab = getActiveTab();

  return (
    <>
      <PageTitle title={t("navigation:page.settingsTitle")} />
      <div className="flex h-full w-full flex-col gap-3 bg-sidebar p-2 sm:gap-4 sm:p-4">
        <div className="relative flex min-h-0 flex-col gap-4 overflow-hidden rounded-md border border-border bg-card p-3 sm:p-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate({
                  to: "/dashboard/workspace/$workspaceId",
                  params: { workspaceId: workspace?.id ?? "" },
                })
              }
            >
              <ChevronLeft className=" border border-border rounded-md p-1 size-6" />
              {t("navigation:page.backToWorkspace")}
            </Button>

            <h1 className="text-2xl font-semibold pl-2 mt-2">
              {t("navigation:page.settingsTitle")}
            </h1>

            <Tabs value={activeTab} className="w-full max-w-full pt-2">
              <TabsList className="max-w-full justify-start gap-2 overflow-x-auto bg-sidebar">
                <TabsTrigger
                  className="shrink-0 [&[data-state=active]]:rounded-md [&[data-state=active]]:border [&[data-state=active]]:border-border [&[data-state=active]]:bg-card"
                  value="account"
                  onClick={() =>
                    navigate({ to: "/dashboard/settings/account/information" })
                  }
                >
                  {t("settings:account")}
                </TabsTrigger>
                <TabsTrigger
                  value="workspace"
                  className="shrink-0 [&[data-state=active]]:rounded-md [&[data-state=active]]:border [&[data-state=active]]:border-border [&[data-state=active]]:bg-card"
                  onClick={() =>
                    navigate({ to: "/dashboard/settings/workspace/general" })
                  }
                >
                  {t("navigation:page.settingsWorkspaceTab")}
                </TabsTrigger>
                <TabsTrigger
                  disabled={projects?.length === 0}
                  value="project"
                  className="shrink-0 [&[data-state=active]]:rounded-md [&[data-state=active]]:border [&[data-state=active]]:border-border [&[data-state=active]]:bg-card"
                  onClick={() =>
                    navigate({ to: "/dashboard/settings/projects" })
                  }
                >
                  {t("navigation:sidebar.projects")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
