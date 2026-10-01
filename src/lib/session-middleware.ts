import "server-only";

import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { SessionUser } from "@/lib/serializers";
import { getUserFromToken } from "@/services/auth-service";

type AdditionalContext = {
  Variables: {
    user: SessionUser;
  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(
  async (c, next) => {
    const token = getCookie(c, AUTH_COOKIE);
    if (!token) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    c.set("user", user);
    await next();
  }
);
