import { client } from "@kaneo/libs";

async function getTasks(projectId: string, moduleId?: string) {
  const response = await client.task.tasks[":projectId"].$get({
    param: { projectId },
    query: moduleId ? { moduleId } : {},
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const json = await response.json();

  return json.data;
}

export default getTasks;
