import { client } from "@kaneo/libs";

async function getProjectMembers(projectId: string) {
  const response = await client.project[":id"].members.$get({
    param: { id: projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getProjectMembers;
