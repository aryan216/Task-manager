import "server-only";

import { Prisma, TaskStatus } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { prisma } from "@/lib/db";

type AnalyticsScope = {
  workspaceId?: string;
  projectId?: string;
  assigneeId: string;
};

export async function getTaskAnalytics(scope: AnalyticsScope) {
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
