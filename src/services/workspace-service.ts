import "server-only";

import { prisma } from "@/lib/db";
import { resolveImage } from "@/lib/images";
import {
  toList,
  toWorkspace,
  WorkspaceDocument,
} from "@/lib/serializers";
import { ServiceError } from "@/lib/service-error";
import { generateInviteCode } from "@/lib/utils";
import { MemberRole } from "@/features/members/types";
import { getMember } from "@/services/member-service";
import { getTaskAnalytics } from "@/services/analytics-service";

export async function listWorkspaces(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    select: { workspaceId: true },
  });

  if (memberships.length === 0) {
    return toList<WorkspaceDocument>([]);
  }

  const workspaces = await prisma.workspace.findMany({
    where: { id: { in: memberships.map((member) => member.workspaceId) } },
    orderBy: { createdAt: "desc" },
  });

  return toList(workspaces.map(toWorkspace));
}

export async function getWorkspace(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new ServiceError("Workspace not found", 404);
  }

  return toWorkspace(workspace);
}

export async function getWorkspaceInfo(workspaceId: string) {
  const workspace = await getWorkspace(workspaceId);
  return {
    $id: workspace.$id,
    name: workspace.name,
    imageUrl: workspace.imageUrl,
  };
}

export async function getWorkspaceAnalytics(
  workspaceId: string,
  userId: string
) {
  const member = await requireMember(workspaceId, userId);
  return getTaskAnalytics({
    workspaceId,
    assigneeId: member.$id,
  });
}

export async function createWorkspace(input: {
  name: string;
  image?: File | string;
  userId: string;
}) {
  const imageUrl = await resolveImage(input.image);

  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      imageUrl,
      userId: input.userId,
      inviteCode: generateInviteCode(6),
      members: {
        create: {
          userId: input.userId,
          role: MemberRole.ADMIN,
        },
      },
    },
  });

  return toWorkspace(workspace);
}

export async function resetInviteCode(workspaceId: string, userId: string) {
  await requireAdmin(workspaceId, userId);

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode: generateInviteCode(6) },
  });

  return toWorkspace(workspace);
}

export async function joinWorkspace(input: {
  workspaceId: string;
  userId: string;
  code: string;
}) {
  const existing = await getMember(input.workspaceId, input.userId);
  if (existing) {
    throw new ServiceError("Already a member", 400);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
  });

  if (!workspace) {
    throw new ServiceError("Workspace not found", 404);
  }

  if (workspace.inviteCode !== input.code) {
    throw new ServiceError("Invalid invite code", 400);
  }

  await prisma.member.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      role: MemberRole.MEMBER,
    },
  });

  return toWorkspace(workspace);
}

export async function updateWorkspace(input: {
  workspaceId: string;
  userId: string;
  name?: string;
  image?: File | string;
}) {
  await requireAdmin(input.workspaceId, input.userId);
  const imageUrl =
    input.image === undefined ? undefined : await resolveImage(input.image);

  const workspace = await prisma.workspace.update({
    where: { id: input.workspaceId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });

  return toWorkspace(workspace);
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  await requireAdmin(workspaceId, userId);
  await prisma.workspace.delete({ where: { id: workspaceId } });
  return { $id: workspaceId };
}

async function requireMember(workspaceId: string, userId: string) {
  const member = await getMember(workspaceId, userId);
  if (!member) {
    throw new ServiceError("Unauthorized", 401);
  }
  return member;
}

async function requireAdmin(workspaceId: string, userId: string) {
  const member = await requireMember(workspaceId, userId);
  if (member.role !== MemberRole.ADMIN) {
    throw new ServiceError("Unauthorized", 401);
  }
  return member;
}
