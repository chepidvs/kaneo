import { getApiUrl } from "@/fetchers/get-api-url";

export type WorkspaceTask = {
  id: string;
  number: number | null;
  title: string;
  status: string;
  priority: string | null;
  projectId: string;
  projectSlug: string;
  projectName: string;
  dueDate: string | null;
  startDate: string | null;
  createdAt: string;
  assignees: Array<{
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
};

export type WorkspaceTasksResponse = {
  data: WorkspaceTask[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type WorkspaceTasksParams = {
  workspaceId: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "dueDate" | "priority" | "title" | "number";
  sortOrder?: "asc" | "desc";
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
};

async function getWorkspaceTasks(
  params: WorkspaceTasksParams,
): Promise<WorkspaceTasksResponse> {
  const {
    workspaceId,
    page = 1,
    limit = 50,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    priority,
    assigneeId,
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("sortBy", sortBy);
  qs.set("sortOrder", sortOrder);

  if (status && status.length > 0) {
    for (const s of status) qs.append("status[]", s);
  }
  if (priority && priority.length > 0) {
    for (const p of priority) qs.append("priority[]", p);
  }
  if (assigneeId && assigneeId.length > 0) {
    for (const a of assigneeId) qs.append("assigneeId[]", a);
  }

  const response = await fetch(
    getApiUrl(`/workspace/${workspaceId}/tasks?${qs.toString()}`),
    { credentials: "include" },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getWorkspaceTasks;
