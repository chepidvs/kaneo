import { client } from "@kaneo/libs";

async function restoreWorkspaceBackup(workspaceId: string, backup: unknown) {
  const response = await client.workspace[":workspaceId"].restore.$post({
    param: { workspaceId },
    json: backup,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default restoreWorkspaceBackup;
