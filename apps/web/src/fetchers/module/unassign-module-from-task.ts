import { client } from "@kaneo/libs";

async function unassignModuleFromTask(moduleId: string, taskId: string) {
  const response = await client.module[":id"].task.$delete({
    param: { id: moduleId },
    json: { taskId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default unassignModuleFromTask;
