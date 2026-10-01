"use client";

import { useSearchParams } from "next/navigation";
import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";

const GITHUB_AUTH_ERRORS: Record<string, string> = {
  github_denied: "GitHub sign-in was cancelled.",
  github_email:
    "GitHub did not share a verified email. Verify an email on GitHub, then try again.",
  github_state: "GitHub sign-in expired. Try again.",
  github_config: "GitHub sign-in is not configured yet.",
  github: "Could not sign in with GitHub.",
};

export const GithubAuthError = () => {
  const searchParams = useSearchParams();
  const message = GITHUB_AUTH_ERRORS[searchParams.get("error") ?? ""];

  if (!message) {
    return null;
  }

  return (
    <p className="mb-4 text-center text-sm text-destructive" role="alert">
      {message}
    </p>
  );
};

export const GithubAuthButton = () => {
  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="lg" className="w-full">
        <a href="/api/auth/github">
          <Github />
          Continue with GitHub
        </a>
      </Button>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
};
