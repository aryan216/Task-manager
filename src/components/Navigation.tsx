"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Home, Settings, Users } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

const routes = [
  { label: "Home", href: "", icon: Home },
  { label: "Tasks", href: "/tasks", icon: CheckCircle2 },
  { label: "Members", href: "/members", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Navigation = () => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {routes.map((item) => {
        const fullHref = `/workspaces/${workspaceId}${item.href}`;
        const isActive = pathname === fullHref;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={fullHref}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground",
              isActive && "bg-accent font-medium text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
