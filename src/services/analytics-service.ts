import "server-only";

import { Prisma, TaskStatus } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getRedis, RedisConfigError } from "@/lib/redis";

const ANALYTICS_TTL_SECONDS = 60;

const analyticsSchema = z.object({
  taskCount: z.number(),
  taskDifference: z.number(),
  assignedTaskCount: z.number(),
  assignedTaskDifference: z.number(),
  incompleteTaskCount: z.number(),
  incompleteTaskDifference: z.number(),
  completedTaskCount: z.number(),
  completedTaskDifference: z.number(),
  overdueTaskCount: z.number(),
  overdueTaskDifference: z.number(),
});

type AnalyticsResult = z.infer<typeof analyticsSchema>;

type AnalyticsScope = {
  workspaceId?: string;
  projectId?: string;
  assigneeId: string;
};

export async function bumpAnalyticsVersion(workspaceId: string) {
  try {
    await getRedis().incr(analyticsVersionKey(workspaceId));
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
  }
}

export async function getTaskAnalytics(scope: AnalyticsScope) {
  const version = scope.workspaceId
    ? await readAnalyticsVersion(scope.workspaceId)
    : null;

  if (scope.workspaceId && version !== null) {
    const key = analyticsCacheKey(scope, version);
    const cached = await readAnalyticsCache(key);
    if (cached) {
      return cached;
    }

    const result = await computeTaskAnalytics(scope);
    await writeAnalyticsCache(key, result);
    return result;
  }

  return computeTaskAnalytics(scope);
}

async function computeTaskAnalytics(scope: AnalyticsScope) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const base: Prisma.TaskWhereInput = {
    ...(scope.workspaceId ? { workspaceId: scope.workspaceId } : {}),
    ...(scope.projectId ? { projectId: scope.projectId } : {}),
  };

  const compare = async (extra: Prisma.TaskWhereInput = {}) => {
    const [current, previous] = await Promise.all([
      prisma.task.count({
        where: {
          ...base,
          ...extra,
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      prisma.task.count({
        where: {
          ...base,
          ...extra,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);

    return { count: current, difference: current - previous };
  };

  const [tasks, assigned, incomplete, completed, overdue] = await Promise.all([
    compare(),
    compare({ assigneeId: scope.assigneeId }),
    compare({ status: { not: TaskStatus.DONE } }),
    compare({ status: TaskStatus.DONE }),
    compare({
      status: { not: TaskStatus.DONE },
      dueDate: { lt: now },
    }),
  ]);

  return {
    taskCount: tasks.count,
    taskDifference: tasks.difference,
    assignedTaskCount: assigned.count,
    assignedTaskDifference: assigned.difference,
    incompleteTaskCount: incomplete.count,
    incompleteTaskDifference: incomplete.difference,
    completedTaskCount: completed.count,
    completedTaskDifference: completed.difference,
    overdueTaskCount: overdue.count,
    overdueTaskDifference: overdue.difference,
  };
}

function analyticsVersionKey(workspaceId: string) {
  return `analytics-version:${workspaceId}`;
}

function analyticsCacheKey(scope: AnalyticsScope, version: number) {
  return `analytics:${scope.workspaceId}:${version}:${scope.projectId ?? "all"}:${scope.assigneeId}`;
}

async function readAnalyticsVersion(workspaceId: string): Promise<number | null> {
  try {
    const value = await getRedis().get(analyticsVersionKey(workspaceId));
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return 0;
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
    return null;
  }
}

async function readAnalyticsCache(key: string): Promise<AnalyticsResult | null> {
  try {
    const value = await getRedis().get(key);
    const parsed = analyticsSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
    return null;
  }
}

async function writeAnalyticsCache(key: string, result: AnalyticsResult) {
  try {
    await getRedis().set(key, result, { ex: ANALYTICS_TTL_SECONDS });
  } catch (error) {
    if (error instanceof RedisConfigError) {
      throw error;
    }
  }
}
