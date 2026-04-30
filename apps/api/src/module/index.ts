import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { moduleSchema } from "../schemas";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createModule from "./controllers/create-module";
import deleteModule from "./controllers/delete-module";
import getModule from "./controllers/get-module";
import getModules from "./controllers/get-modules";
import updateModule from "./controllers/update-module";

const module = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/project/:projectId",
    describeRoute({
      operationId: "listModules",
      tags: ["Modules"],
      description: "Get all modules for a project",
      responses: {
        200: {
          description: "List of modules ordered by position",
          content: {
            "application/json": { schema: resolver(v.array(moduleSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const modules = await getModules(projectId);
      return c.json(modules);
    },
  )
  .post(
    "/project/:projectId",
    describeRoute({
      operationId: "createModule",
      tags: ["Modules"],
      description: "Create a new module in a project",
      responses: {
        200: {
          description: "Module created successfully",
          content: {
            "application/json": { schema: resolver(moduleSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { name, description } = c.req.valid("json");
      const createdModule = await createModule({
        projectId,
        name,
        description,
      });
      return c.json(createdModule);
    },
  )
  .get(
    "/:id",
    describeRoute({
      operationId: "getModule",
      tags: ["Modules"],
      description: "Get a module by ID",
      responses: {
        200: {
          description: "Module details",
          content: {
            "application/json": { schema: resolver(moduleSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromModule(),
    async (c) => {
      const { id } = c.req.valid("param");
      const module = await getModule(id);
      return c.json(module);
    },
  )
  .put(
    "/:id",
    describeRoute({
      operationId: "updateModule",
      tags: ["Modules"],
      description: "Update a module",
      responses: {
        200: {
          description: "Module updated successfully",
          content: {
            "application/json": { schema: resolver(moduleSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        name: v.optional(v.string()),
        description: v.optional(v.nullable(v.string())),
        position: v.optional(v.number()),
      }),
    ),
    workspaceAccess.fromModule(),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updatedModule = await updateModule(id, data);
      return c.json(updatedModule);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "deleteModule",
      tags: ["Modules"],
      description: "Delete a module",
      responses: {
        200: {
          description: "Module deleted successfully",
          content: {
            "application/json": { schema: resolver(moduleSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromModule(),
    async (c) => {
      const { id } = c.req.valid("param");
      const deletedModule = await deleteModule(id);
      return c.json(deletedModule);
    },
  );

export default module;
