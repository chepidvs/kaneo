type Page = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export default Page;
