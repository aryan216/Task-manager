"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";

export const Projects = () => {
  const pathname = usePathname();
  const { open } = useCreateProjectModal();
  const workspaceId = useWorkspaceId();
  const { data } = useGetProjects({ workspaceId });

  return (
    <div className=" flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2">
        <p className=" text-[11px] font-medium tracking-wide text-muted-foreground">Projects</p>
        <button
          type="button"
          onClick={() => open()}
          aria-label="Create project"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {data?.documents.map((project) => {
        const href = `/workspaces/${workspaceId}/projects/${project.$id}`;
        const isActive = pathname === href;

        return (
          <Link href={href} key={project.$id}>
            <div
              className={cn(
                " flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground",
                isActive && " bg-accent font-medium text-foreground"
              )}
            >
              <ProjectAvatar image={project.imageUrl} name={project.name} />
              <span className=" truncate">{project.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
