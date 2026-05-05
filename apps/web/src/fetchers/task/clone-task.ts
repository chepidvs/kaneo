import { client } from "@kaneo/libs";

async function cloneTask(taskId: string) {
  const response = await client.task.clone[":id"].$post({
    param: { id: taskId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default cloneTask;
