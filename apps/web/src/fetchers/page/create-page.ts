import { client } from "@kaneo/libs";

async function createPage(
  projectId: string,
  data: {
    title: string;
    slug?: string;
    content?: string;
    isPublic?: boolean;
  },
) {
  const response = await client.page.project[":projectId"].$post({
    param: { projectId },
    json: data,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createPage;
