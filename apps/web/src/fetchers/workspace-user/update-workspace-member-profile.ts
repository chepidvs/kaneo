import { getApiUrl } from "@/fetchers/get-api-url";

export type UpdateWorkspaceMemberProfileRequest = {
  workspaceId: string;
  userId: string;
  name?: string;
  username?: string | null;
  image?: string | null;
};

async function updateWorkspaceMemberProfile({
  workspaceId,
  userId,
  name,
  username,
  image,
}: UpdateWorkspaceMemberProfileRequest) {
  const response = await fetch(
    getApiUrl(`/workspace/${workspaceId}/members/${userId}/profile`),
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        username,
        image,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateWorkspaceMemberProfile;
