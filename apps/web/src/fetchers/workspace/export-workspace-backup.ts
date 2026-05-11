import { client } from "@kaneo/libs";

async function exportWorkspaceBackup(workspaceId: string) {
  const response = await client.workspace[":workspaceId"].backup.$get({
    param: { workspaceId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default exportWorkspaceBackup;
