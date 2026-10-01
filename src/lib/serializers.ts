import type { Member, Project, Task, User, Workspace } from "@prisma/client";

import { MemberRole } from "@/features/members/types";
import { TaskStatus } from "@/features/tasks/types";

export type SessionUser = {
  $id: string;
  name: string;
  email: string;
};

export type WorkspaceDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  imageUrl: string;
  inviteCode: string;
  userId: string;
};

export type ProjectDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  imageUrl: string;
  workspaceId: string;
};

export type MemberDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  name: string;
  email: string;
};

export type TaskDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  status: TaskStatus;
  workspaceId: string;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  position: number;
  description: string;
};

export type DocumentList<T> = {
  documents: T[];
  total: number;
};

function timestamps(record: { id: string; createdAt: Date; updatedAt: Date }) {
  return {
    $id: record.id,
    $createdAt: record.createdAt.toISOString(),
    $updatedAt: record.updatedAt.toISOString(),
  };
}

export function toSessionUser(user: Pick<User, "id" | "name" | "email">): SessionUser {
  return {
    $id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function toWorkspace(workspace: Workspace): WorkspaceDocument {
  return {
    ...timestamps(workspace),
    name: workspace.name,
    imageUrl: workspace.imageUrl ?? "",
    inviteCode: workspace.inviteCode,
    userId: workspace.userId,
  };
}

export function toProject(project: Project): ProjectDocument {
  return {
    ...timestamps(project),
    name: project.name,
    imageUrl: project.imageUrl ?? "",
    workspaceId: project.workspaceId,
  };
}

export function toMember(
  member: Member & { user: Pick<User, "name" | "email"> }
): MemberDocument {
  return {
    ...timestamps(member),
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role as MemberRole,
    name: member.user.name || member.user.email,
    email: member.user.email,
  };
}

export function toTask(task: Task): TaskDocument {
  return {
    ...timestamps(task),
    name: task.name,
    status: task.status as TaskStatus,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate.toISOString(),
    position: task.position,
    description: task.description,
  };
}

export function toList<T>(documents: T[]): DocumentList<T> {
  return {
    documents,
    total: documents.length,
  };
}
