import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useCancelInvitation from "@/hooks/mutations/workspace-user/use-cancel-invitation";
import useDeleteWorkspaceUser from "@/hooks/mutations/workspace-user/use-delete-workspace-user";
import useUpdateWorkspaceMemberProfile from "@/hooks/mutations/workspace-user/use-update-workspace-member-profile";
import useUpdateWorkspaceUserRole from "@/hooks/mutations/workspace-user/use-update-workspace-user-role";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { formatDateMedium } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Route } from "@/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/members";
import type {
  WorkspaceUser,
  WorkspaceUserInvitation,
} from "@/types/workspace-user";
import { useAuth } from "../providers/auth-provider/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type WorkspaceRole = "owner" | "admin" | "member";

function formatRole(role?: string | null) {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function getMemberProfile(member: WorkspaceUser | null) {
  return {
    name: member?.user?.name || "",
    username: member?.user?.username || "",
    image: member?.user?.image || "",
  };
}

function MembersTable({
  invitations,
  users,
}: {
  invitations: WorkspaceUserInvitation[];
  users: WorkspaceUser[];
}) {
  const [memberToDelete, setMemberToDelete] = useState<WorkspaceUser | null>(
    null,
  );
  const [memberToEdit, setMemberToEdit] = useState<WorkspaceUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editImage, setEditImage] = useState("");

  const [invitationToCancel, setInvitationToCancel] =
    useState<WorkspaceUserInvitation | null>(null);

  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { workspaceId } = Route.useParams();
  const { isOwner, isAdmin } = useWorkspacePermission();

  const canEditProfiles = isOwner || isAdmin;

  const { mutateAsync: deleteWorkspaceUser, isPending } =
    useDeleteWorkspaceUser();
  const { mutateAsync: cancelInvitation, isPending: isCancelling } =
    useCancelInvitation();
  const { mutateAsync: updateWorkspaceUserRole, isPending: isUpdatingRole } =
    useUpdateWorkspaceUserRole();
  const {
    mutateAsync: updateWorkspaceMemberProfile,
    isPending: isUpdatingProfile,
  } = useUpdateWorkspaceMemberProfile(workspaceId);

  useEffect(() => {
    const profile = getMemberProfile(memberToEdit);

    setEditName(profile.name);
    setEditUsername(profile.username);
    setEditImage(profile.image);
  }, [memberToEdit]);

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await deleteWorkspaceUser({
        workspaceId,
        userId: memberToDelete.user.email,
      });
      toast.success(t("team:membersTable.removeSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("team:membersTable.removeError"),
      );
    } finally {
      setMemberToDelete(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;

    try {
      await cancelInvitation({
        invitationId: invitationToCancel.id,
        workspaceId,
      });
      toast.success(t("team:membersTable.cancelInviteSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("team:membersTable.cancelInviteError"),
      );
    } finally {
      setInvitationToCancel(null);
    }
  };

  const handleRoleChange = async (
    member: WorkspaceUser,
    role: WorkspaceRole,
  ) => {
    if (!isOwner) return;
    if (currentUser?.id === member.userId) {
      toast.error("You cannot change your own workspace role");
      return;
    }

    try {
      await updateWorkspaceUserRole({
        workspaceId,
        memberId: member.id,
        role,
      });

      toast.success("Workspace member role updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update workspace member role",
      );
    }
  };

  const handleUpdateProfile = async () => {
    if (!memberToEdit) return;

    try {
      await updateWorkspaceMemberProfile({
        workspaceId,
        userId: memberToEdit.userId,
        name: editName,
        username: editUsername.trim() ? editUsername.trim() : null,
        image: editImage.trim() ? editImage.trim() : null,
      });

      toast.success("Workspace member profile updated");
      setMemberToEdit(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update member profile",
      );
    }
  };

  if (users?.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {t("team:membersTable.emptyTitle")}
            </h3>
            <p className="text-muted-foreground">
              {t("team:membersTable.emptyDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground text-xs w-2/3 pl-6">
              {t("team:membersTable.columns.name")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("team:membersTable.columns.role")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("team:membersTable.columns.joined")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs pr-6 text-right">
              {t("team:membersTable.columns.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {invitations
            .filter(
              (invitation) =>
                invitation.status !== "accepted" &&
                invitation.status !== "canceled",
            )
            ?.map((invitation) => (
              <TableRow key={invitation.email} className="cursor-pointer">
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {invitation?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{invitation.email}</span>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                    {t("team:membersTable.memberRolePending", {
                      role: formatRole(invitation.role),
                    })}
                  </span>
                </TableCell>

                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground">
                    {invitation.expiresAt &&
                      formatDateMedium(invitation.expiresAt)}
                  </span>
                </TableCell>

                <TableCell className="py-3 pr-6 text-right">
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvitationToCancel(invitation);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={t("team:membersTable.ariaCancelInvitation")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

          {users?.map((member) => {
            const isCurrentUser = currentUser?.id === member.userId;
            const canEditRole = isOwner && !isCurrentUser;

            return (
              <TableRow key={member.user.email} className="cursor-pointer">
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={member.user.image ?? ""}
                        alt={member.user.name || ""}
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {member?.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5">
                      <span>{member.user.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  {canEditRole ? (
                    <select
                      value={member.role}
                      disabled={isUpdatingRole}
                      onChange={(event) =>
                        handleRoleChange(
                          member,
                          event.target.value as WorkspaceRole,
                        )
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      {formatRole(member.role)}
                    </span>
                  )}
                </TableCell>

                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground">
                    {member.createdAt && formatDateMedium(member.createdAt)}
                  </span>
                </TableCell>

                <TableCell className="py-3 pr-6 text-right">
                  <div className="flex justify-end gap-1">
                    {canEditProfiles && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToEdit(member);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Edit member profile"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}

                    {isOwner && !isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToDelete(member);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={t("team:membersTable.ariaRemoveMember")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!memberToEdit}
        onOpenChange={(open) => !open && setMemberToEdit(null)}
      >
        <AlertDialogContent className="max-w-xl w-full p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit member profile</AlertDialogTitle>
            <AlertDialogDescription>
              Update this workspace member profile information.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Member name"
              />
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={editUsername}
                onChange={(event) => setEditUsername(event.target.value)}
                placeholder="username"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscore only.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input
                value={editImage}
                onChange={(event) => setEditImage(event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogClose disabled={isUpdatingProfile}>
              <Button variant="outline" size="sm" disabled={isUpdatingProfile}>
                {t("common:actions.cancel")}
              </Button>
            </AlertDialogClose>

            <Button
              size="sm"
              disabled={isUpdatingProfile || !editName.trim()}
              onClick={handleUpdateProfile}
            >
              Save changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("team:membersTable.removeDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("team:membersTable.removeDialogDescription", {
                name:
                  memberToDelete?.user.name || memberToDelete?.user.email || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogClose disabled={isPending}>
              <Button variant="outline" size="sm" disabled={isPending}>
                {t("common:actions.cancel")}
              </Button>
            </AlertDialogClose>

            <AlertDialogClose onClick={handleDeleteMember} disabled={isPending}>
              <Button variant="destructive" size="sm" disabled={isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t("team:membersTable.removeMember")}
              </Button>
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={(open) => !open && setInvitationToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("team:membersTable.cancelDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("team:membersTable.cancelDialogDescription", {
                email: invitationToCancel?.email ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogClose disabled={isCancelling}>
              <Button variant="outline" size="sm" disabled={isCancelling}>
                {t("common:actions.cancel")}
              </Button>
            </AlertDialogClose>

            <AlertDialogClose
              onClick={handleCancelInvitation}
              disabled={isCancelling}
            >
              <Button variant="destructive" size="sm" disabled={isCancelling}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t("team:membersTable.cancelInvitation")}
              </Button>
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default MembersTable;
