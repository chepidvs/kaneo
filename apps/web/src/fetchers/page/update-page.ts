import { client } from "@kaneo/libs";

async function updatePage(
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    isPublic?: boolean;
  },
) {
  const response = await client.page[":id"].$put({
    param: { id },
    json: data,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updatePage;
