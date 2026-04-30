import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { pageSchema } from "../schemas";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createPage from "./controllers/create-page";
import deletePage from "./controllers/delete-page";
import getPage from "./controllers/get-page";
import getPagesByProject from "./controllers/get-pages-by-project";
import getPublicPage from "./controllers/get-public-page";
import updatePage from "./controllers/update-page";

const page = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/project/:projectId",
    describeRoute({
      operationId: "listPagesByProject",
      tags: ["Pages"],
      description: "Get all pages for a project",
      responses: {
        200: {
          description: "List of pages ordered by position",
          content: {
            "application/json": { schema: resolver(v.array(pageSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const pages = await getPagesByProject(projectId);
      return c.json(pages);
    },
  )
  .post(
    "/project/:projectId",
    describeRoute({
      operationId: "createPage",
      tags: ["Pages"],
      description: "Create a new knowledge base page in a project",
      responses: {
        200: {
          description: "Page created successfully",
          content: {
            "application/json": { schema: resolver(pageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        title: v.string(),
        slug: v.optional(v.string()),
        content: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { title, slug, content, isPublic } = c.req.valid("json");
      const userId = c.get("userId");
      const createdPage = await createPage({
        projectId,
        title,
        slug,
        content,
        isPublic,
        createdBy: userId,
      });
      return c.json(createdPage);
    },
  )
  .get(
    "/public/:id",
    describeRoute({
      operationId: "getPublicPage",
      tags: ["Pages"],
      description: "Get a public page by ID",
      security: [],
      responses: {
        200: {
          description: "Public page details",
          content: {
            "application/json": { schema: resolver(pageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    async (c) => {
      const { id } = c.req.valid("param");
      const page = await getPublicPage(id);
      return c.json(page);
    },
  )
  .get(
    "/:id",
    describeRoute({
      operationId: "getPage",
      tags: ["Pages"],
      description: "Get a page by ID",
      responses: {
        200: {
          description: "Page details",
          content: {
            "application/json": { schema: resolver(pageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromPage(),
    async (c) => {
      const { id } = c.req.valid("param");
      const page = await getPage(id);
      return c.json(page);
    },
  )
  .put(
    "/:id",
    describeRoute({
      operationId: "updatePage",
      tags: ["Pages"],
      description: "Update a page",
      responses: {
        200: {
          description: "Page updated successfully",
          content: {
            "application/json": { schema: resolver(pageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        title: v.optional(v.string()),
        slug: v.optional(v.string()),
        content: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
      }),
    ),
    workspaceAccess.fromPage(),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updatedPage = await updatePage(id, data);
      return c.json(updatedPage);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "deletePage",
      tags: ["Pages"],
      description: "Delete a page",
      responses: {
        200: {
          description: "Page deleted successfully",
          content: {
            "application/json": { schema: resolver(pageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromPage(),
    async (c) => {
      const { id } = c.req.valid("param");
      const deletedPage = await deletePage(id);
      return c.json(deletedPage);
    },
  );

export default page;
