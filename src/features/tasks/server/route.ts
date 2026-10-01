import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { rethrowServiceError } from "@/lib/service-error";
import {
  bulkUpdateTasks,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "@/services/task-service";

import { TaskStatus } from "../types";
import { createTaskSchema } from "../schemas";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      try {
        const data = await listTasks(c.req.valid("query"), c.get("user").$id);
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .get("/:taskId", sessionMiddleware, async (c) => {
    try {
      const data = await getTask(c.req.param("taskId"), c.get("user").$id);
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createTaskSchema),
    async (c) => {
      try {
        const data = await createTask(c.req.valid("json"), c.get("user").$id);
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .post(
    "/bulk-update",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            $id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number().int().positive().min(1000).max(1_000_000),
          })
        ),
      })
    ),
    async (c) => {
      try {
        const data = await bulkUpdateTasks(
          c.req.valid("json").tasks,
          c.get("user").$id
        );
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .patch(
    "/:taskId",
    sessionMiddleware,
    zValidator("json", createTaskSchema.partial()),
    async (c) => {
      try {
        const data = await updateTask(
          c.req.param("taskId"),
          c.req.valid("json"),
          c.get("user").$id
        );
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .delete("/:taskId", sessionMiddleware, async (c) => {
    try {
      const data = await deleteTask(c.req.param("taskId"), c.get("user").$id);
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  });

export default app;
