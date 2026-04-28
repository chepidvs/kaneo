import { client } from "@kaneo/libs";

async function removeProjectMember({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const response = await client.project[":id"].members[":userId"].$delete({
    param: { id: projectId, userId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default removeProjectMember;
