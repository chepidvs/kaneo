type TaskLabel = {
  id: string;
  name: string;
  color: string;
};

type TaskModule = {
  id: string;
  name: string;
};

type TaskExternalLink = {
  id: string;
  taskId: string;
  integrationId: string;
  resourceType: string;
  externalId: string;
  url: string;
  title: string | null;
  metadata: Record<string, unknown> | null;
};

type TaskAssignee = {
  id: string;
  name: string;
  image: string | null;
};

type Task = {
  id: string;
  title: string;
  number: number | null;
  description: string | null;
  status: string;
  priority: string | null;
  startDate: string | null;
  dueDate: string | null;
  position: number | null;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string | null;
  userId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeImage?: string | null;
  assignees?: TaskAssignee[];
  projectId: string;
  columnId?: string | null;
  modules?: TaskModule[];
  labels?: TaskLabel[];
  externalLinks?: TaskExternalLink[];
};

export type { TaskAssignee };
export default Task;
