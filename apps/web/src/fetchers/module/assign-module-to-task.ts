import { client } from "@kaneo/libs";

async function assignModuleToTask(moduleId: string, taskId: string) {
  const response = await client.module[":id"].task.$put({
    param: { id: moduleId },
    json: { taskId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default assignModuleToTask;
