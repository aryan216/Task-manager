import "server-only";

import { prisma } from "@/lib/db";
import { resolveImage } from "@/lib/images";
import { ProjectDocument, toList, toProject } from "@/lib/serializers";
import { ServiceError } from "@/lib/service-error";
import { getTaskAnalytics } from "@/services/analytics-service";
import { getMember } from "@/services/member-service";

export async function listProjects(workspaceId: string, userId: string) {
  await requireMember(workspaceId, userId);

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return toList<ProjectDocument>(projects.map(toProject));
}

export async function getProject(projectId: string, userId: string) {
  const project = await findProject(projectId);
  await requireMember(project.workspaceId, userId);
  return toProject(project);
}

export async function getProjectAnalytics(projectId: string, userId: string) {
  const project = await findProject(projectId);
  const member = await requireMember(project.workspaceId, userId);

  return getTaskAnalytics({
    workspaceId: project.workspaceId,
    projectId: project.id,
    assigneeId: member.$id,
  });
}

export async function createProject(input: {
  name: string;
  workspaceId: string;
  userId: string;
  image?: File | string;
}) {
  await requireMember(input.workspaceId, input.userId);
  const imageUrl = await resolveImage(input.image);

  const project = await prisma.project.create({
    data: {
      name: input.name,
      imageUrl,
      workspaceId: input.workspaceId,
    },
  });

  return toProject(project);
}

export async function updateProject(input: {
  projectId: string;
  userId: string;
  name?: string;
  image?: File | string;
}) {
  const existing = await findProject(input.projectId);
  await requireMember(existing.workspaceId, input.userId);
  const imageUrl =
    input.image === undefined ? undefined : await resolveImage(input.image);

  const project = await prisma.project.update({
    where: { id: input.projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });

  return toProject(project);
}

export async function deleteProject(projectId: string, userId: string) {
  const existing = await findProject(projectId);
  await requireMember(existing.workspaceId, userId);
  await prisma.project.delete({ where: { id: projectId } });
  return { $id: existing.id };
}

async function findProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new ServiceError("Project not found", 404);
  }
  return project;
}

async function requireMember(workspaceId: string, userId: string) {
  const member = await getMember(workspaceId, userId);
  if (!member) {
    throw new ServiceError("Unauthorized", 401);
  }
  return member;
}
