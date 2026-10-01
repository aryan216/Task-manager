import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { rethrowServiceError } from "@/lib/service-error";
import {
  createProject,
  deleteProject,
  getProject,
  getProjectAnalytics,
  listProjects,
  updateProject,
} from "@/services/project-service";

import { createProjectSchema, updateProjectSchema } from "../schema";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      try {
        const { workspaceId } = c.req.valid("query");
        const data = await listProjects(workspaceId, c.get("user").$id);
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .get("/:projectId", sessionMiddleware, async (c) => {
    try {
      const data = await getProject(c.req.param("projectId"), c.get("user").$id);
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .get("/:projectId/analytics", sessionMiddleware, async (c) => {
    try {
      const data = await getProjectAnalytics(
        c.req.param("projectId"),
        c.get("user").$id
      );
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", createProjectSchema),
    async (c) => {
      try {
        const { name, image, workspaceId } = c.req.valid("form");
        const data = await createProject({
          name,
          image,
          workspaceId,
          userId: c.get("user").$id,
        });
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .patch(
    "/:projectId",
    sessionMiddleware,
    zValidator("form", updateProjectSchema),
    async (c) => {
      try {
        const { name, image } = c.req.valid("form");
        const data = await updateProject({
          projectId: c.req.param("projectId"),
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
  .delete("/:projectId", sessionMiddleware, async (c) => {
    try {
      const data = await deleteProject(
        c.req.param("projectId"),
        c.get("user").$id
      );
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  });

export default app;
