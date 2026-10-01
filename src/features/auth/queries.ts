import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE } from "./constants";
import { getUserFromToken } from "@/services/auth-service";

export const getCurrent = async () => {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return getUserFromToken(token);
};
