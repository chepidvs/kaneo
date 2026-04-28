import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import db, { schema } from "../database";
import { userTable } from "../database/schema";
import {
  getWorkspaceRole,
  isWorkspaceManager,
} from "../utils/permissions/project-access";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getWorkspaceMembersCtrl from "./controllers/get-workspace-members";

const workspace = new Hono<{
  Variables: {
    userId: string;
    workspaceId: string;
  };
}>()
  .get(
    "/:workspaceId/members",
    describeRoute({
      operationId: "getWorkspaceMembers",
      tags: ["Workspaces"],
      description: "Get all members of a workspace",
      responses: {
        200: {
          description: "List of workspace members",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    id: v.string(),
                    name: v.string(),
                    email: v.string(),
                    image: v.nullable(v.string()),
                    username: v.nullable(v.string()),
                    role: v.string(),
                  }),
                ),
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    workspaceAccess.fromParam("workspaceId"),
    async (c) => {
      const workspaceId = c.get("workspaceId");
      const members = await getWorkspaceMembersCtrl(workspaceId);
      return c.json(members);
    },
  )
  .patch(
    "/:workspaceId/members/:targetUserId/profile",
    describeRoute({
      operationId: "updateWorkspaceMemberProfile",
      tags: ["Workspaces"],
      description: "Update a workspace member profile",
      responses: {
        200: {
          description: "Workspace member profile updated",
        },
      },
    }),
    validator(
      "param",
      v.object({
        workspaceId: v.string(),
        targetUserId: v.string(),
      }),
    ),
    validator(
      "json",
      v.object({
        name: v.optional(v.string()),
        username: v.optional(v.nullable(v.string())),
        image: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromParam("workspaceId"),
    async (c) => {
      const actorUserId = c.get("userId");
      const workspaceId = c.get("workspaceId");
      const { targetUserId } = c.req.valid("param");
      const { name, username, image } = c.req.valid("json");

      const actorRole = await getWorkspaceRole(actorUserId, workspaceId);

      if (!isWorkspaceManager(actorRole)) {
        throw new HTTPException(403, {
          message: "Only workspace owner or admin can edit member profiles",
        });
      }

      const [targetMembership] = await db
        .select({ id: schema.workspaceUserTable.id })
        .from(schema.workspaceUserTable)
        .where(
          and(
            eq(schema.workspaceUserTable.workspaceId, workspaceId),
            eq(schema.workspaceUserTable.userId, targetUserId),
          ),
        )
        .limit(1);

      if (!targetMembership) {
        throw new HTTPException(404, {
          message: "Target user is not a member of this workspace",
        });
      }

      const updatePayload: {
        name?: string;
        username?: string | null;
        image?: string | null;
      } = {};

      if (typeof name === "string") {
        const trimmedName = name.trim();

        if (trimmedName.length < 1) {
          throw new HTTPException(400, {
            message: "Name cannot be empty",
          });
        }

        updatePayload.name = trimmedName;
      }

      if (username !== undefined) {
        const normalizedUsername =
          typeof username === "string" ? username.toLowerCase().trim() : null;

        if (
          normalizedUsername &&
          !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)
        ) {
          throw new HTTPException(400, {
            message:
              "Username must be 3-30 characters and only use lowercase letters, numbers, and underscore",
          });
        }

        updatePayload.username = normalizedUsername;
      }

      if (image !== undefined) {
        updatePayload.image = image;
      }

      if (Object.keys(updatePayload).length === 0) {
        throw new HTTPException(400, {
          message: "No profile fields provided",
        });
      }

      const [updatedUser] = await db
        .update(userTable)
        .set(updatePayload)
        .where(eq(userTable.id, targetUserId))
        .returning({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
          username: userTable.username,
        });

      return c.json(updatedUser);
    },
  );

export default workspace;
