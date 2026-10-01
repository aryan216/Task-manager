import { z } from "zod";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { rethrowServiceError } from "@/lib/service-error";
import {
  deleteMember,
  getMember,
  listMembers,
  updateMemberRole,
} from "@/services/member-service";

import { MemberRole } from "../types";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("query");
      const user = c.get("user");

      try {
        const member = await getMember(workspaceId, user.$id);
        if (!member) {
          throw new HTTPException(401, { message: "Unauthorized" });
        }

        const members = await listMembers(workspaceId);
        return c.json({ data: members });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  )
  .delete("/:memberId", sessionMiddleware, async (c) => {
    try {
      const data = await deleteMember(c.req.param("memberId"), c.get("user").$id);
      return c.json({ data });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
    async (c) => {
      try {
        const data = await updateMemberRole(
          c.req.param("memberId"),
          c.req.valid("json").role,
          c.get("user").$id
        );
        return c.json({ data });
      } catch (error) {
        rethrowServiceError(error);
      }
    }
  );

export default app;
