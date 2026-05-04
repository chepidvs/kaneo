import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageTitle from "@/components/page-title";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type {
  AllRolePermissions,
  RolePermissions,
} from "@/fetchers/workspace/get-role-permissions";
import useUpdateRolePermissions from "@/hooks/mutations/workspace/use-update-role-permissions";
import { useRolePermissions } from "@/hooks/queries/workspace/use-role-permissions";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/roles",
)({
  component: RouteComponent,
});

type ConfigurableRole = "admin" | "member" | "guest";

const ROLE_LABELS: Record<ConfigurableRole, string> = {
  admin: "Admin",
  member: "Member",
  guest: "Guest",
};

type PermissionRow = {
  resource: string;
  action: string;
  label: string;
  lockedOn: boolean;
  lockedOff: boolean;
};

const PERMISSION_ROWS: PermissionRow[] = [
  // Workspace
  {
    resource: "workspace",
    action: "read",
    label: "Read workspace",
    lockedOn: true,
    lockedOff: false,
  },
  {
    resource: "workspace",
    action: "update",
    label: "Update workspace",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "workspace",
    action: "manage_settings",
    label: "Manage workspace settings",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "workspace",
    action: "delete",
    label: "Delete workspace",
    lockedOn: false,
    lockedOff: true,
  },
  // Projects
  {
    resource: "project",
    action: "read",
    label: "Read projects",
    lockedOn: true,
    lockedOff: false,
  },
  {
    resource: "project",
    action: "create",
    label: "Create projects",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "project",
    action: "update",
    label: "Update projects",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "project",
    action: "delete",
    label: "Delete projects",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "project",
    action: "share",
    label: "Manage project access",
    lockedOn: false,
    lockedOff: false,
  },
  // Tasks
  {
    resource: "task",
    action: "read",
    label: "Read tasks",
    lockedOn: true,
    lockedOff: false,
  },
  {
    resource: "task",
    action: "create",
    label: "Create tasks",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "task",
    action: "update",
    label: "Update tasks",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "task",
    action: "delete",
    label: "Delete tasks",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "task",
    action: "assign",
    label: "Assign tasks",
    lockedOn: false,
    lockedOff: false,
  },
  // Team
  {
    resource: "team",
    action: "invite",
    label: "Invite members",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "team",
    action: "remove",
    label: "Remove members",
    lockedOn: false,
    lockedOff: false,
  },
  {
    resource: "team",
    action: "manage_roles",
    label: "Manage roles",
    lockedOn: false,
    lockedOff: true,
  },
];

const SECTION_LABELS: Record<string, string> = {
  workspace: "Workspace",
  project: "Projects",
  task: "Tasks",
  team: "Team",
};

const CONFIGURABLE_ROLES: ConfigurableRole[] = ["admin", "member", "guest"];

function hasPermission(
  permissions: RolePermissions,
  resource: string,
  action: string,
): boolean {
  return permissions[resource]?.includes(action) ?? false;
}

function togglePermission(
  permissions: RolePermissions,
  resource: string,
  action: string,
): RolePermissions {
  const current = permissions[resource] ?? [];
  const updated = current.includes(action)
    ? current.filter((a) => a !== action)
    : [...current, action];
  return { ...permissions, [resource]: updated };
}

function RouteComponent() {
  const { isOwner } = useWorkspacePermission();
  const { data, isLoading } = useRolePermissions();
  const { mutateAsync: updatePermissions, isPending } =
    useUpdateRolePermissions();

  const [localPerms, setLocalPerms] = useState<AllRolePermissions | null>(null);

  useEffect(() => {
    if (data && !localPerms) {
      setLocalPerms(data);
    }
  }, [data, localPerms]);

  const handleToggle = useCallback(
    async (role: ConfigurableRole, resource: string, action: string) => {
      if (!localPerms) return;

      const updated = togglePermission(localPerms[role], resource, action);
      const optimistic = { ...localPerms, [role]: updated };
      setLocalPerms(optimistic);

      try {
        const saved = await updatePermissions({ role, permissions: updated });
        setLocalPerms((prev) => (prev ? { ...prev, [role]: saved } : prev));
      } catch {
        setLocalPerms(localPerms);
        toast.error("Failed to update permissions");
      }
    },
    [localPerms, updatePermissions],
  );

  const sections = [...new Set(PERMISSION_ROWS.map((r) => r.resource))];

  if (isLoading || !localPerms) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Roles & Permissions" />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Configure what each role can do in this workspace. Owner always has
            full access.
          </p>
        </div>

        <div className="border border-border rounded-md bg-sidebar overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_repeat(3,_100px)] gap-4 px-4 py-3 border-b border-border bg-sidebar-accent/40">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Permission
            </span>
            {CONFIGURABLE_ROLES.map((role) => (
              <span
                key={role}
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-center"
              >
                {ROLE_LABELS[role]}
              </span>
            ))}
          </div>

          {/* Rows grouped by section */}
          {sections.map((section, sectionIdx) => {
            const rows = PERMISSION_ROWS.filter((r) => r.resource === section);
            return (
              <div key={section}>
                {sectionIdx > 0 && <Separator />}
                <div className="px-4 py-2 bg-sidebar-accent/20">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {SECTION_LABELS[section] ?? section}
                  </span>
                </div>
                {rows.map((row) => (
                  <div
                    key={`${row.resource}.${row.action}`}
                    className="grid grid-cols-[1fr_repeat(3,_100px)] gap-4 px-4 py-2.5 items-center hover:bg-sidebar-accent/10 border-t border-border/40"
                  >
                    <span className="text-sm text-foreground/80">
                      {row.label}
                    </span>
                    {CONFIGURABLE_ROLES.map((role) => {
                      const checked =
                        row.lockedOn ||
                        hasPermission(
                          localPerms[role],
                          row.resource,
                          row.action,
                        );
                      const isLocked = row.lockedOn || row.lockedOff;
                      const disabled = !isOwner || isLocked || isPending;

                      return (
                        <div
                          key={role}
                          className="flex justify-center items-center"
                        >
                          {isLocked ? (
                            <div className="flex items-center gap-1 opacity-40">
                              <Checkbox checked={row.lockedOn} disabled />
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </div>
                          ) : (
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={() =>
                                handleToggle(role, row.resource, row.action)
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Owner row — always full access, read-only */}
          <Separator />
          <div className="px-4 py-3 bg-sidebar-accent/10">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Owner</span> —
              always has full access to all permissions and cannot be
              configured.
            </p>
          </div>
        </div>

        {!isOwner && (
          <p className="text-xs text-muted-foreground">
            Only the workspace owner can modify role permissions.
          </p>
        )}
      </div>
    </>
  );
}
