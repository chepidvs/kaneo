import { client } from "@kaneo/libs";

async function updateModule(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    position?: number;
  },
) {
  const response = await client.module[":id"].$put({
    param: { id },
    json: data,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateModule;
