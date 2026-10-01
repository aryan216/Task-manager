"use client";

import { UserButton } from "@/features/auth/components/user-button";

import MobileSidebar from "./mobile-sidebar";
import { usePathname } from "next/navigation";

const pathnameMap = {
  tasks: {
    title: "Tasks",
    description: "Everything assigned across this workspace.",
  },
  projects: {
    title: "Project",
    description: "Work living inside this project.",
  },
};

const defaultMap = {
  title: "Home",
  description: "A quiet view of what needs attention.",
};

export const Navbar = () => {

  const pathname = usePathname();
  const pathnameParts = pathname.split("/");
  const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap;

  const { title, description } = pathnameMap[pathnameKey] || defaultMap;

  return (
    <nav className="flex items-center justify-between px-6 pt-6">
      <div className="hidden flex-col gap-1 lg:flex">
        <h1 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <MobileSidebar />
      <UserButton />
    </nav>
  );
};
