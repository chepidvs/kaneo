import { client } from "@kaneo/libs";

async function validateWorkspaceBackup(backup: unknown) {
  const response = await client.workspace.backup.validate.$post({
    json: backup,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default validateWorkspaceBackup;
