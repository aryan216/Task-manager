import "server-only";

import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export class RedisConfigError extends Error {
  constructor() {
    super("Redis is not configured");
    this.name = "RedisConfigError";
  }
}

export function getRedis(): Redis {
  if (client) {
    return client;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new RedisConfigError();
  }

  client = new Redis({ url, token });
  return client;
}
