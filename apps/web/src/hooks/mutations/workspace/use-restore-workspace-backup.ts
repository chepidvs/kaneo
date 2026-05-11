import { useMutation } from "@tanstack/react-query";
import restoreWorkspaceBackup from "@/fetchers/workspace/restore-workspace-backup";

function useRestoreWorkspaceBackup() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      backup,
    }: {
      workspaceId: string;
      backup: unknown;
    }) => restoreWorkspaceBackup(workspaceId, backup),
  });
}

export default useRestoreWorkspaceBackup;
