import { client } from "@kaneo/libs";

async function addProjectMember({
  projectId,
  userId,
  role = "member",
}: {
  projectId: string;
  userId: string;
  role?: string;
}) {
  const response = await client.project[":id"].members.$post({
    param: { id: projectId },
    json: { userId, role },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default addProjectMember;
