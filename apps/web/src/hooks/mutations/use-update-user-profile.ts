import { useMutation } from "@tanstack/react-query";
import { getApiUrl } from "@/fetchers/get-api-url";
import { authClient } from "@/lib/auth-client";

type UpdateUserProfileRequest = {
  name?: string;
  locale?: string;
  username?: string;
};

async function updateUsername(username: string) {
  const response = await fetch(getApiUrl("/user/username"), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to update username");
  }

  return response.json();
}

function useUpdateUserProfile() {
  return useMutation({
    mutationFn: async ({
      name,
      locale,
      username,
    }: UpdateUserProfileRequest) => {
      // update name & locale via Better Auth
      if (name !== undefined || locale !== undefined) {
        const { error } = await authClient.updateUser({
          name,
          locale,
        });

        if (error) {
          throw new Error(error.message || "Failed to update user profile");
        }
      }

      // update username via custom endpoint
      if (username !== undefined) {
        return updateUsername(username);
      }

      return true;
    },
  });
}

export default useUpdateUserProfile;
