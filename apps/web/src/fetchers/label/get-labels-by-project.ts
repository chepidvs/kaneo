import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type GetLabelsByProjectRequest = InferRequestType<
  (typeof client)["label"]["project"][":projectId"]["$get"]
>["param"];

async function getLabelsByProject({ projectId }: GetLabelsByProjectRequest) {
  const response = await client.label.project[":projectId"].$get({
    param: {
      projectId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default getLabelsByProject;