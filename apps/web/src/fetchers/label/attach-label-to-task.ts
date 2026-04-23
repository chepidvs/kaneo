import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type AttachLabelToTaskRequest =
  InferRequestType<(typeof client)["label"][":id"]["task"]["$put"]>["param"] &
    InferRequestType<(typeof client)["label"][":id"]["task"]["$put"]>["json"];

async function attachLabelToTask({
  id,
  taskId,
}: AttachLabelToTaskRequest) {
  const response = await client.label[":id"].task.$put({
    param: { id },
    json: { taskId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default attachLabelToTask;