import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode) {
    super(message);
    this.status = status;
  }
}

export function rethrowServiceError(error: unknown): never {
  if (error instanceof ServiceError) {
    throw new HTTPException(error.status, { message: error.message });
  }

  throw error;
}
