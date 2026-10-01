import "server-only";

import { MemberRole as PrismaMemberRole } from "@prisma/client";

import { MemberRole } from "@/features/members/types";
import { prisma } from "@/lib/db";
import {
  MemberDocument,
  toList,
  toMember,
} from "@/lib/serializers";
import { ServiceError } from "@/lib/service-error";

export async function getMember(workspaceId: string, userId: string) {
  const member = await prisma.member.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: { user: true },
  });

  return member ? toMember(member) : null;
}

export async function listMembers(
  workspaceId: string
): Promise<ReturnType<typeof toList<MemberDocument>>> {
  const members = await prisma.member.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return toList(members.map(toMember));
}

export async function deleteMember(memberId: string, actorUserId: string) {
  const memberToDelete = await prisma.member.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!memberToDelete) {
    throw new ServiceError("Member not found", 404);
  }

  const actor = await getMember(memberToDelete.workspaceId, actorUserId);
  if (!actor) {
    throw new ServiceError("Unauthorized", 401);
  }

  if (actor.$id !== memberToDelete.id && actor.role !== MemberRole.ADMIN) {
    throw new ServiceError("Unauthorized", 401);
  }

  const memberCount = await prisma.member.count({
    where: { workspaceId: memberToDelete.workspaceId },
  });

  if (memberCount === 1) {
    throw new ServiceError("Cannot delete the only member", 400);
  }

  const assignedTasks = await prisma.task.count({
    where: { assigneeId: memberId },
  });

  if (assignedTasks > 0) {
    throw new ServiceError(
      "Reassign this member's tasks before removing them",
      400
    );
  }

  await prisma.member.delete({ where: { id: memberId } });
  return { $id: memberToDelete.id };
}

export async function updateMemberRole(
  memberId: string,
  role: MemberRole,
  actorUserId: string
) {
  const memberToUpdate = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!memberToUpdate) {
    throw new ServiceError("Member not found", 404);
  }

  const actor = await getMember(memberToUpdate.workspaceId, actorUserId);
  if (!actor || actor.role !== MemberRole.ADMIN) {
    throw new ServiceError("Unauthorized", 401);
  }

  const memberCount = await prisma.member.count({
    where: { workspaceId: memberToUpdate.workspaceId },
  });

  if (memberCount === 1) {
    throw new ServiceError("Cannot downgrade the only member", 400);
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { role: role as PrismaMemberRole },
  });

  return { $id: memberToUpdate.id };
}
