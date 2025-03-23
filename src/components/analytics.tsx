import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { AnalyticsCard } from "./analytics-card";
import { DottedSeparator } from "./dotted-separator";

export const Analytics = ({ data }: ProjectAnalyticsResponseType) => {

    return (
        <ScrollArea className=" border rounded-lg w-full whitespace-nowrap shrink-0">
            <div className=" w-full flex flex-row">
                <div className=" flex items-center flex-1">
                    <AnalyticsCard
                        title="Total tasks"
                        value={data.taskCount}
                        variant={data.taskDifference ? "up" : "down"}
                        increaseValue={data.taskDifference} />
                </div>
                <DottedSeparator direction="vertical" />
                <div className=" flex items-center flex-1">
                    <AnalyticsCard
                        title="Assigned Tasks"
                        value={data.assignedTaskCount}
                        variant={data.assignedTaskDifference ? "up" : "down"}
                        increaseValue={data.taskDifference} />
                </div>
                <DottedSeparator direction="vertical" />
                <div className=" flex items-center flex-1">
                    <AnalyticsCard
                        title="Completed Tasks"
                        value={data.completedTaskCount}
                        variant={data.completedTaskDifference ? "up" : "down"}
                        increaseValue={data.taskDifference} />
                </div>
                <DottedSeparator direction="vertical" />
                <div className=" flex items-center flex-1">
                    <AnalyticsCard
                        title="Incomplete Tasks"
                        value={data.incompleteTaskCount}
                        variant={data.incompleteTaskDifference ? "up" : "down"}
                        increaseValue={data.taskDifference} />
                </div>
                <DottedSeparator direction="vertical" />
                <div className=" flex items-center flex-1">
                    <AnalyticsCard
                        title="Overdue Tasks"
                        value={data.overdueTaskCount}
                        variant={data.overdueTaskDifference ? "up" : "down"}
                        increaseValue={data.taskDifference} />
                </div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    )

}