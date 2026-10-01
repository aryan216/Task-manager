import "server-only";

import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";
import { ServiceError } from "@/lib/service-error";
import { SessionUser, toSessionUser } from "@/lib/serializers";

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

  const token = await createSession(user.id);
  return { token, user: toSessionUser(user) };
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

  const token = await createSession(user.id);
  return { token, user: toSessionUser(user) };
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

    const token = await createSession(existing.id);
    return { token, user: toSessionUser(existing) };
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        githubId: input.githubId,
      },
    });
    const token = await createSession(user.id);
    return { token, user: toSessionUser(user) };
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }

    const raced = await findGithubUser(input.githubId, email);
    if (!raced) {
      throw new ServiceError("Could not sign in with GitHub", 409);
    }

    const token = await createSession(raced.id);
    return { token, user: toSessionUser(raced) };
  }
}

export async function logoutUser(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserFromToken(
  token: string
): Promise<SessionUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return toSessionUser(session.user);
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

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });
  return token;
}
