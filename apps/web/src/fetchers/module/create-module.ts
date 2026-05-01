import { client } from "@kaneo/libs";

async function createModule(
  projectId: string,
  data: {
    name: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
  },
) {
  const response = await client.module.project[":projectId"].$post({
    param: { projectId },
    json: data,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createModule;
