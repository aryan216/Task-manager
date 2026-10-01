import "server-only";

import { Prisma, TaskStatus as PrismaTaskStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

import { TaskStatus } from "@/features/tasks/types";
import { prisma } from "@/lib/db";
import {
  MemberDocument,
  ProjectDocument,
  TaskDocument,
  toList,
  toMember,
  toProject,
  toTask,
} from "@/lib/serializers";
import { ServiceError } from "@/lib/service-error";
import { bumpAnalyticsVersion } from "@/services/analytics-service";
import { getMember } from "@/services/member-service";

export type PopulatedTask = TaskDocument & {
  project: ProjectDocument;
  assignee: MemberDocument;
};

type TaskFilters = {
  workspaceId: string;
  projectId?: string | null;
  assigneeId?: string | null;
  status?: TaskStatus | null;
  search?: string | null;
  dueDate?: string | null;
};

type TaskInput = {
  name?: string;
  status?: TaskStatus;
  workspaceId?: string;
  projectId?: string;
  dueDate?: Date;
  assigneeId?: string;
  description?: string;
};

const taskInclude = {
  project: true,
  assignee: { include: { user: true } },
} satisfies Prisma.TaskInclude;

export async function listTasks(filters: TaskFilters, userId: string) {
  await requireMember(filters.workspaceId, userId);

  const where: Prisma.TaskWhereInput = {
    workspaceId: filters.workspaceId,
  };

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }
  if (filters.status) {
    where.status = filters.status as PrismaTaskStatus;
  }
  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }
  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.dueDate) {
    const day = new Date(filters.dueDate);
    if (!Number.isNaN(day.getTime())) {
      where.dueDate = { gte: startOfDay(day), lte: endOfDay(day) };
    }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });

  return toList(tasks.map(populateTask));
}

export async function getTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });

  if (!task) {
    throw new ServiceError("Task not found", 404);
  }

  await requireMember(task.workspaceId, userId);
  return populateTask(task);
}

export async function createTask(
  input: Required<
    Pick<
      TaskInput,
      "name" | "status" | "workspaceId" | "projectId" | "dueDate" | "assigneeId"
    >
  > &
    Pick<TaskInput, "description">,
  userId: string
) {
  await requireMember(input.workspaceId, userId);
  await assertTaskRelations(input.workspaceId, input.projectId, input.assigneeId);

  const highest = await prisma.task.findFirst({
    where: {
      status: input.status as PrismaTaskStatus,
      workspaceId: input.workspaceId,
    },
    orderBy: { position: "desc" },
  });

  const task = await prisma.task.create({
    data: {
      name: input.name,
      status: input.status as PrismaTaskStatus,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      description: input.description ?? "",
      position: highest ? highest.position + 1000 : 1000,
    },
  });

  await bumpAnalyticsVersion(task.workspaceId);
  return toTask(task);
}

export async function updateTask(
  taskId: string,
  input: TaskInput,
  userId: string
) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) {
    throw new ServiceError("Task not found", 404);
  }

  await requireMember(existing.workspaceId, userId);

  const workspaceId = input.workspaceId ?? existing.workspaceId;
  const projectId = input.projectId ?? existing.projectId;
  const assigneeId = input.assigneeId ?? existing.assigneeId;
  await assertTaskRelations(workspaceId, projectId, assigneeId);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined
        ? { status: input.status as PrismaTaskStatus }
        : {}),
      ...(input.workspaceId !== undefined
        ? { workspaceId: input.workspaceId }
        : {}),
      ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.assigneeId !== undefined
        ? { assigneeId: input.assigneeId }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    },
  });

  await bumpAnalyticsVersion(existing.workspaceId);
  if (task.workspaceId !== existing.workspaceId) {
    await bumpAnalyticsVersion(task.workspaceId);
  }
  return toTask(task);
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new ServiceError("Task not found", 404);
  }

  await requireMember(task.workspaceId, userId);
  await prisma.task.delete({ where: { id: taskId } });
  await bumpAnalyticsVersion(task.workspaceId);
  return { $id: task.id };
}

export async function bulkUpdateTasks(
  tasks: { $id: string; status: TaskStatus; position: number }[],
  userId: string
) {
  const existing = await prisma.task.findMany({
    where: { id: { in: tasks.map((task) => task.$id) } },
  });

  if (existing.length !== tasks.length) {
    throw new ServiceError("Task not found", 404);
  }

  const workspaceIds = new Set(existing.map((task) => task.workspaceId));
  if (workspaceIds.size !== 1) {
    throw new ServiceError("All tasks must be of same workspace", 400);
  }

  const workspaceId = existing[0]?.workspaceId;
  if (!workspaceId) {
    throw new ServiceError("Task not found", 404);
  }

  await requireMember(workspaceId, userId);

  const updated = await prisma.$transaction(
    tasks.map((task) =>
      prisma.task.update({
        where: { id: task.$id },
        data: {
          status: task.status as PrismaTaskStatus,
          position: task.position,
        },
      })
    )
  );

  await bumpAnalyticsVersion(workspaceId);
  return updated.map(toTask);
}

function populateTask(
  task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>
): PopulatedTask {
  return {
    ...toTask(task),
    project: toProject(task.project),
    assignee: toMember(task.assignee),
  };
}

async function assertTaskRelations(
  workspaceId: string,
  projectId: string,
  assigneeId: string
) {
  const [project, assignee] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.member.findUnique({ where: { id: assigneeId } }),
  ]);

  if (!project || project.workspaceId !== workspaceId) {
    throw new ServiceError("Project not found", 404);
  }

  if (!assignee || assignee.workspaceId !== workspaceId) {
    throw new ServiceError("Assignee not found", 404);
  }
}

async function requireMember(workspaceId: string, userId: string) {
  const member = await getMember(workspaceId, userId);
  if (!member) {
    throw new ServiceError("Unauthorized", 401);
  }
  return member;
}
