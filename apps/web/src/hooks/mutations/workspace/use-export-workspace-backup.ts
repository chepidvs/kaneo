import { useMutation } from "@tanstack/react-query";
import exportWorkspaceBackup from "@/fetchers/workspace/export-workspace-backup";

function useExportWorkspaceBackup() {
  return useMutation({
    mutationFn: (workspaceId: string) => exportWorkspaceBackup(workspaceId),
  });
}

export default useExportWorkspaceBackup;
