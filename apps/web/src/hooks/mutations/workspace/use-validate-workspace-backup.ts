import { useMutation } from "@tanstack/react-query";
import validateWorkspaceBackup from "@/fetchers/workspace/validate-workspace-backup";

function useValidateWorkspaceBackup() {
  return useMutation({
    mutationFn: (backup: unknown) => validateWorkspaceBackup(backup),
  });
}

export default useValidateWorkspaceBackup;
