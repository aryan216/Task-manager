import "server-only";

import { z } from "zod";

import { ServiceError } from "@/lib/service-error";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

export const GITHUB_EMAIL_ERROR = "GitHub account has no verified email";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1).optional(),
  error: z.string().optional(),
});

const githubUserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  name: z.string().nullable(),
});

const githubEmailSchema = z.object({
  email: z.string().email(),
  primary: z.boolean(),
  verified: z.boolean(),
});

export interface GithubProfile {
  githubId: string;
  email: string;
  name: string;
}

function githubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!clientId || !clientSecret || !appUrl) {
    throw new ServiceError("GitHub sign-in is not configured", 500);
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/github/callback`,
  };
}

export function githubAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = githubConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

export async function fetchGithubProfile(code: string): Promise<GithubProfile> {
  const accessToken = await exchangeGithubCode(code);
  const [user, emails] = await Promise.all([
    githubGet(GITHUB_USER_URL, accessToken, githubUserSchema),
    githubGet(GITHUB_EMAILS_URL, accessToken, z.array(githubEmailSchema)),
  ]);

  const email = pickVerifiedEmail(emails);
  if (!email) {
    throw new ServiceError(GITHUB_EMAIL_ERROR, 400);
  }

  return {
    githubId: String(user.id),
    email,
    name: displayName(user.name, user.login),
  };
}

async function exchangeGithubCode(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = githubConfig();

  let response: Response;
  try {
    response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
  } catch {
    throw new ServiceError("Could not sign in with GitHub", 502);
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsed = tokenResponseSchema.safeParse(payload);

  if (!response.ok || !parsed.success || !parsed.data.access_token) {
    throw new ServiceError("Could not sign in with GitHub", 502);
  }

  return parsed.data.access_token;
}

async function githubGet<T>(
  url: string,
  accessToken: string,
  schema: z.ZodType<T>
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "jeera",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch {
    throw new ServiceError("Could not sign in with GitHub", 502);
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new ServiceError("Could not sign in with GitHub", 502);
  }

  return parsed.data;
}

function pickVerifiedEmail(
  emails: z.infer<typeof githubEmailSchema>[]
): string | null {
  const verified = emails.filter((email) => email.verified);
  const primary = verified.find((email) => email.primary);
  return (primary ?? verified[0])?.email.toLowerCase() ?? null;
}

function displayName(name: string | null, login: string): string {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed.slice(0, 80);
  }

  return login.slice(0, 80);
}
