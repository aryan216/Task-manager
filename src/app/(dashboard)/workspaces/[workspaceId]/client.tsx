"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, PlusIcon, SettingsIcon } from "lucide-react";

import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics";

import { Button } from "@/components/ui/button";
import { Analytics } from "@/components/analytics";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { MemberAvatar } from "@/features/members/components/member-avatar";

export const WorkspaceIdClient = () => {

    const workspaceId = useWorkspaceId();

    const { data: analytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId })
    const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId });
    const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

    const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers;

    if (isLoading) {
        return <PageLoader />
    }

    if (!analytics || !tasks || !projects || !members) {
        return <PageError message="Failed to load workspace data" />
    }



    return (
        <div className="flex h-full flex-col gap-6">
            <Analytics data={analytics} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TaskList data={tasks.documents} total={tasks.total} />
                <ProjectList data={projects.documents} total={projects.total} />
                <MembersList data={members.documents} total={members.total} />
            </div>
        </div>
    )
};


interface TaskListProps {
    data: Task[];
    total: number;
}

export const TaskList = ({ data, total }: TaskListProps) => {

    const workspaceId = useWorkspaceId()
    const { open: createTask } = useCreateTaskModal();

    return (
        <div className=" flex flex-col gap-y-4 col-span-1">
            <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                        Tasks ({total})
                    </p>
                    <Button variant="ghost" size="icon" onClick={createTask} aria-label="Create task">
                        <PlusIcon className="size-4" />
                    </Button>
                </div>
                <ul className=" flex flex-col gap-y-4">
                    {data.map((task) => (
                        <li key={task.$id}>
                            <Link href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
                                <Card className="rounded-xl transition-colors duration-200 hover:bg-accent">
                                    <CardContent className="p-4">
                                        <p className="truncate text-base font-medium">{task.name}</p>
                                        <div className=" flex items-center gap-x-2">
                                            <p>{task.project?.name}</p>
                                            <div className=" size-1 rounded-full bg-neutral-300" />
                                            <div className=" text-sm text-muted-foreground flex items-center">
                                                <CalendarIcon className=" size-3 mr-1" />
                                                <span>
                                                    {formatDistanceToNow(new Date(task.dueDate))}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                    <li className="hidden py-6 text-center text-sm text-muted-foreground first-of-type:block">Nothing due yet.</li>
                </ul>
                <Button variant={"muted"} className="mt-4 w-full" asChild>
                    <Link href={`/workspaces/${workspaceId}/tasks`}>
                        Show All
                    </Link>
                </Button>
            </div>
        </div>
    )
}



interface ProjectListProps {
    data: Project[];
    total: number;
}

export const ProjectList = ({ data, total }: ProjectListProps) => {

    const workspaceId = useWorkspaceId()
    const { open: createProject } = useCreateProjectModal();

    return (
        <div className=" flex flex-col gap-y-4 col-span-1">
            <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                        Projects ({total})
                    </p>
                    <Button variant="ghost" size="icon" onClick={createProject} aria-label="Create project">
                        <PlusIcon className="size-4" />
                    </Button>
                </div>
                <ul className=" grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.map((project) => (
                        <li key={project.$id}>
                            <Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
                                <Card className="rounded-xl transition-colors duration-200 hover:bg-accent">
                                    <CardContent className="flex items-center gap-x-2.5 p-4">
                                        <ProjectAvatar className=" size-12" fallbackClassName=" text-lg" name={project.name} image={project.imageUrl} />
                                        <p className=" text-lg font-medium truncate">
                                            {project.name}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                    <li className="hidden py-6 text-center text-sm text-muted-foreground first-of-type:block">No projects yet.</li>
                </ul>
            </div>
        </div>
    )
}



interface MembersListProps {
    data: Member[];
    total: number;
}

export const MembersList = ({ data, total }: MembersListProps) => {

    const workspaceId = useWorkspaceId()

    return (
        <div className=" flex flex-col gap-y-4 col-span-1">
            <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                        Members ({total})
                    </p>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/workspaces/${workspaceId}/members`} aria-label="Manage members">
                            <SettingsIcon className="size-4" />
                        </Link>
                    </Button>
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {data.map((member) => (
                        <li key={member.$id} className="min-w-0">
                            <Card className="rounded-xl">
                                <CardContent className="flex flex-col items-center gap-3 px-4 py-5">
                                    <MemberAvatar
                                        name={member.name}
                                        className="size-11"
                                        fallbackClassName="text-base"
                                    />
                                    <div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
                                        <p className="w-full truncate text-sm font-medium">
                                            {member.name}
                                        </p>
                                        <p
                                            className="w-full truncate text-xs text-muted-foreground"
                                            title={member.email}
                                        >
                                            {member.email}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                    <li className="hidden py-6 text-center text-sm text-muted-foreground first-of-type:block">No members yet.</li>
                </ul>
            </div>
        </div>
    )
}