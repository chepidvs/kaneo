import { client } from "@kaneo/libs";

async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const response = await client.task.assignees[":id"].$put({
    param: { id: taskId },
    json: { userIds },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default updateTaskAssignees;
