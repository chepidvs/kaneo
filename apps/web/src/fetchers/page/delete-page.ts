import { client } from "@kaneo/libs";

async function deletePage(id: string) {
  const response = await client.page[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default deletePage;
