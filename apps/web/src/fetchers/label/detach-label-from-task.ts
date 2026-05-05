import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type DetachLabelFromTaskRequest = InferRequestType<
  (typeof client)["label"][":id"]["task"][":taskId"]["$delete"]
>["param"];

async function detachLabelFromTask({ id, taskId }: DetachLabelFromTaskRequest) {
  const response = await client.label[":id"].task[":taskId"].$delete({
    param: { id, taskId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default detachLabelFromTask;
