import "server-only";

import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

import { z } from "zod";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getRedis, RedisConfigError } from "@/lib/redis";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";
import { ServiceError } from "@/lib/service-error";
import { SessionUser, toSessionUser } from "@/lib/serializers";

const sessionUserSchema = z.object({
  $id: z.string(),
  name: z.string(),
  email: z.string(),
});

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: SessionUser }> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new ServiceError("Email is already registered", 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash: await hashPassword(input.password),
    },
  });

  const sessionUser = toSessionUser(user);
  const token = await createSession(sessionUser);
  return { token, user: sessionUser };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: SessionUser }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (
    !user?.passwordHash ||
    !(await verifyPassword(input.password, user.passwordHash))
  ) {
    throw new ServiceError("Invalid email or password", 401);
  }

  const sessionUser = toSessionUser(user);
  const token = await createSession(sessionUser);
  return { token, user: sessionUser };
}

export async function loginWithGithub(input: {
  githubId: string;
  email: string;
  name: string;
}): Promise<{ token: string; user: SessionUser }> {
  const email = input.email.toLowerCase();
  const existing = await findGithubUser(input.githubId, email);

  if (existing) {
    if (existing.githubId && existing.githubId !== input.githubId) {
      throw new ServiceError(
        "This email is already linked to another GitHub account",
        409
      );
    }

    if (!existing.githubId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { githubId: input.githubId },
      });
    }

    const sessionUser = toSessionUser(existing);
    const token = await createSession(sessionUser);
    return { token, user: sessionUser };
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        githubId: input.githubId,
      },
    });
    const sessionUser = toSessionUser(user);
    const token = await createSession(sessionUser);
    return { token, user: sessionUser };
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }

    const raced = await findGithubUser(input.githubId, email);
    if (!raced) {
      throw new ServiceError("Could not sign in with GitHub", 409);
    }

    const sessionUser = toSessionUser(raced);
    const token = await createSession(sessionUser);
    return { token, user: sessionUser };
  }
}

export async function logoutUser(token: string): Promise<void> {
  await removeCachedSession(token, true);
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserFromToken(
  token: string
): Promise<SessionUser | null> {
  const cached = await readCachedSession(token);
  if (cached) {
    return cached;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    await removeCachedSession(token, false);
    return null;
  }

  const user = toSessionUser(session.user);
  await writeCachedSession(token, user, session.expiresAt);
  return user;
}

async function findGithubUser(githubId: string, email: string) {
  const byGithub = await prisma.user.findUnique({ where: { githubId } });
  if (byGithub) {
    return byGithub;
  }

  return prisma.user.findUnique({ where: { email } });
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function sessionKey(token: string) {
  return `session:${token}`;
}

async function readCachedSession(token: string): Promise<SessionUser | null> {
  try {
    const value = await getRedis().get(sessionKey(token));
    const parsed = sessionUserSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
    return null;
  }
}

async function writeCachedSession(
  token: string,
  user: SessionUser,
  expiresAt: Date
) {
  const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  if (ttl < 1) {
    return;
  }

  try {
    await getRedis().set(sessionKey(token), user, { ex: ttl });
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
  }
}

async function removeCachedSession(token: string, required: boolean) {
  try {
    await getRedis().del(sessionKey(token));
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
    if (required) {
      throw new ServiceError("Could not sign out", 503);
    }
  }
}

async function createSession(user: SessionUser): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({
    data: {
      token,
      userId: user.$id,
      expiresAt,
    },
  });
  await writeCachedSession(token, user, expiresAt);
  return token;
}
