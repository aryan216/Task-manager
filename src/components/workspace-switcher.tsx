"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/hooks/use-create-workspace-modal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

export const WorkspaceSwitcher = () => {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const { data: workspaces } = useGetWorkspaces();
    const { open } = useCreateWorkspaceModal();

    const onSelect = (id: string) => {
        router.push(`/workspaces/${id}`);
    };

    return (
        <div className=" flex flex-col gap-y-2">
            <div className="flex items-center justify-between px-2">
                <p className=" text-[11px] font-medium tracking-wide text-muted-foreground ">
                    Workspace
                </p>
                <button
                    type="button"
                    onClick={open}
                    aria-label="Create workspace"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                    <Plus className="size-4" />
                </button>
            </div>
            <div>
                <Select value={workspaceId} onValueChange={onSelect}>
                    <SelectTrigger className="h-12 w-full rounded-xl border-border bg-card px-2.5 font-medium shadow-none [&>span]:line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center">
                        <SelectValue placeholder="No workspace selected" />
                    </SelectTrigger>
                    <SelectContent>
                        {workspaces?.documents.map((workspace) => (
                            <SelectItem
                                key={workspace.$id}
                                value={workspace.$id}
                                className="rounded-lg py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5 pr-2">
                                    <WorkspaceAvatar
                                        name={workspace.name}
                                        image={workspace.imageUrl}
                                        className="size-7 text-xs"
                                    />
                                    <span className="truncate text-sm font-medium">
                                        {workspace.name}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
