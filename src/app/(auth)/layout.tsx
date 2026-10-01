"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const pathName = usePathname();

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <BrandMark />
          <Button asChild variant="secondary" size="sm">
            <Link href={pathName === "/sign-in" ? "/sign-up" : "/sign-in"}>
              {pathName === "/sign-in" ? "Create account" : "Sign in"}
            </Link>
          </Button>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          {children}
        </div>
      </div>
    </main>
  );
};

export default AuthLayout;
