import { randomBytes, timingSafeEqual } from "node:crypto";

import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

import { AUTH_COOKIE, GITHUB_STATE_COOKIE } from "../constants";
import { loginSchema, registerSchema } from "../Schemas";
import { GITHUB_EMAIL_ERROR, fetchGithubProfile, githubAuthorizeUrl } from "@/lib/github";
import { sessionCookieOptions } from "@/lib/session-cookie";
import { ServiceError, rethrowServiceError } from "@/lib/service-error";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
  loginUser,
  loginWithGithub,
  logoutUser,
  registerUser,
} from "@/services/auth-service";

const route = new Hono()
  .get("/current", sessionMiddleware, async (c) => {
    return c.json({ data: c.get("user") });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    try {
      const { token } = await loginUser(c.req.valid("json"));
      setCookie(c, AUTH_COOKIE, token, sessionCookieOptions());
      return c.json({ success: true });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .post("/register", zValidator("json", registerSchema), async (c) => {
    try {
      const { token } = await registerUser(c.req.valid("json"));
      setCookie(c, AUTH_COOKIE, token, sessionCookieOptions());
      return c.json({ success: true });
    } catch (error) {
      rethrowServiceError(error);
    }
  })
  .get("/github", (c) => {
    let authorizeUrl: string;
    try {
      const state = randomBytes(32).toString("hex");
      authorizeUrl = githubAuthorizeUrl(state);
      setCookie(c, GITHUB_STATE_COOKIE, state, githubStateCookieOptions());
    } catch {
      return c.redirect("/sign-in?error=github_config");
    }

    return c.redirect(authorizeUrl);
  })
  .get("/github/callback", async (c) => {
    const fail = (code: string) => {
      deleteCookie(c, GITHUB_STATE_COOKIE, { path: "/" });
      return c.redirect(`/sign-in?error=${code}`);
    };

    if (c.req.query("error")) {
      return fail("github_denied");
    }

    const code = c.req.query("code");
    const state = c.req.query("state");
    const storedState = getCookie(c, GITHUB_STATE_COOKIE);

    if (!code || !state || !storedState || !safeEqual(state, storedState)) {
      return fail("github_state");
    }

    try {
      const profile = await fetchGithubProfile(code);
      const { token } = await loginWithGithub(profile);
      deleteCookie(c, GITHUB_STATE_COOKIE, { path: "/" });
      setCookie(c, AUTH_COOKIE, token, sessionCookieOptions());
      return c.redirect("/");
    } catch (error) {
      if (error instanceof ServiceError && error.message === GITHUB_EMAIL_ERROR) {
        return fail("github_email");
      }

      return fail("github");
    }
  })
  .post("/logout", sessionMiddleware, async (c) => {
    const token = getCookie(c, AUTH_COOKIE);
    if (token) {
      await logoutUser(token);
    }
    deleteCookie(c, AUTH_COOKIE);
    return c.json({ success: true });
  });

function githubStateCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax" as const,
    maxAge: 60 * 10,
  };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export default route;
