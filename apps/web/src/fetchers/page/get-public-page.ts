import { client } from "@kaneo/libs";

async function getPublicPage(id: string) {
  const response = await client.page.public[":id"].$get({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getPublicPage;
