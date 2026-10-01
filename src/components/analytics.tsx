import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { AnalyticsCard } from "./analytics-card";

export const Analytics = ({ data }: ProjectAnalyticsResponseType) => {
  const cards = [
    {
      title: "Total",
      value: data.taskCount,
      variant: data.taskDifference >= 0 ? "up" : "down",
      increaseValue: data.taskDifference,
    },
    {
      title: "Assigned",
      value: data.assignedTaskCount,
      variant: data.assignedTaskDifference >= 0 ? "up" : "down",
      increaseValue: data.assignedTaskDifference,
    },
    {
      title: "Completed",
      value: data.completedTaskCount,
      variant: data.completedTaskDifference >= 0 ? "up" : "down",
      increaseValue: data.completedTaskDifference,
    },
    {
      title: "Open",
      value: data.incompleteTaskCount,
      variant: data.incompleteTaskDifference >= 0 ? "up" : "down",
      increaseValue: data.incompleteTaskDifference,
    },
    {
      title: "Overdue",
      value: data.overdueTaskCount,
      variant: data.overdueTaskDifference > 0 ? "down" : "up",
      increaseValue: data.overdueTaskDifference,
    },
  ] as const;

  return (
    <ScrollArea className="w-full shrink-0 rounded-2xl border bg-card">
      <div className="flex min-w-max divide-x divide-border">
        {cards.map((card) => (
          <div key={card.title} className="min-w-[180px] flex-1">
            <AnalyticsCard {...card} />
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
