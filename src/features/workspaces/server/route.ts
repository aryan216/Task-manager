import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { HTTPException } from "hono/http-exception";

import { sessionMiddleware } from "@/lib/session-middleware";
import { rethrowServiceError } from "@/lib/service-error";
import { getMember } from "@/services/member-service";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceAnalytics,
  getWorkspaceInfo,
  joinWorkspace,
  listWorkspaces,
  resetInviteCode,
  updateWorkspace,
} from "@/services/workspace-service";

import { createWorkspaceSchema, updateWorkspaceSchema } from "../schema";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const data = await listWorkspaces(c.get("user").$id);
    return c.json({ data });
  })
  .get("/:workspaceId", sessionMiddleware, async (c) => {
    try {
      const workspaceId = c.req.param("workspaceId");
      const member = await getMember(workspaceId, c.get("user").$id);
      if (!member) {
        throw new HTTPException(401, { message: "Unauthorized" });
      }
      const data = await getWorkspace(workspaceId);
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .get("/:workspaceId/info", sessionMiddleware, async (c) => {
    try {
      const data = await getWorkspaceInfo(c.req.param("workspaceId"));
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .get("/:workspaceId/analytics", sessionMiddleware, async (c) => {
    try {
      const data = await getWorkspaceAnalytics(
        c.req.param("workspaceId"),
        c.get("user").$id
      );
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .post(
    "/",
    zValidator("form", createWorkspaceSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { name, image } = c.req.valid("form");
        const data = await createWorkspace({
          name,
          image,
          userId: c.get("user").$id,
        });
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .post("/:workspaceId/reset-invite-code", sessionMiddleware, async (c) => {
    try {
      const data = await resetInviteCode(
        c.req.param("workspaceId"),
        c.get("user").$id
      );
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .post(
    "/:workspaceId/join",
    sessionMiddleware,
    zValidator("json", z.object({ code: z.string() })),
    async (c) => {
      try {
        const data = await joinWorkspace({
          workspaceId: c.req.param("workspaceId"),
          userId: c.get("user").$id,
          code: c.req.valid("json").code,
        });
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .patch(
    "/:workspaceId",
    sessionMiddleware,
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      try {
        const { name, image } = c.req.valid("form");
        const data = await updateWorkspace({
          workspaceId: c.req.param("workspaceId"),
          userId: c.get("user").$id,
          name,
          image,
        });
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .delete("/:workspaceId", sessionMiddleware, async (c) => {
    try {
      const data = await deleteWorkspace(
        c.req.param("workspaceId"),
        c.get("user").$id
      );
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  });

export default app;
