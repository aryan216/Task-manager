import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis, RedisConfigError } from "@/lib/redis";
import { ServiceError } from "@/lib/service-error";

const RATE_LIMIT_MESSAGE = "Too many attempts. Try again later.";

let loginByEmail: Ratelimit | null = null;
let loginByIp: Ratelimit | null = null;
let registerByIp: Ratelimit | null = null;
let githubByIp: Ratelimit | null = null;

export function clientAddress(
  forwardedFor: string | undefined,
  realIp: string | undefined
): string {
  const forwarded = forwardedFor?.split(",")[0]?.trim();
  if (forwarded) {
    return forwarded.slice(0, 64);
  }

  const real = realIp?.trim();
  if (real) {
    return real.slice(0, 64);
  }

  return "unknown";
}

export async function assertLoginAllowed(email: string, ip: string) {
  await enforce(loginEmailLimiter(), email.toLowerCase());
  await enforce(loginIpLimiter(), ip);
}

export async function assertRegisterAllowed(ip: string) {
  await enforce(registerIpLimiter(), ip);
}

export async function assertGithubCallbackAllowed(ip: string) {
  await enforce(githubIpLimiter(), ip);
}

function loginEmailLimiter() {
  loginByEmail ??= createLimiter(5, "15 m", "ratelimit:login:email");
  return loginByEmail;
}

function loginIpLimiter() {
  loginByIp ??= createLimiter(20, "15 m", "ratelimit:login:ip");
  return loginByIp;
}

function registerIpLimiter() {
  registerByIp ??= createLimiter(5, "1 h", "ratelimit:register:ip");
  return registerByIp;
}

function githubIpLimiter() {
  githubByIp ??= createLimiter(10, "15 m", "ratelimit:github:ip");
  return githubByIp;
}

function createLimiter(tokens: number, window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`, prefix: string) {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix,
    timeout: 2000,
  });
}

async function enforce(limiter: Ratelimit, identifier: string) {
  try {
    const result = await limiter.limit(identifier);
    if (!result.success) {
      throw new ServiceError(RATE_LIMIT_MESSAGE, 429);
    }
  } catch (error) {
    if (error instanceof ServiceError || error instanceof RedisConfigError) {
      throw error;
    }
  }
}
