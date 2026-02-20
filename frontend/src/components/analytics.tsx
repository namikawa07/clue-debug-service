import { AnalyticsCard } from "./analytics-card";

interface AnalyticsProps {
    data: {
        taskCount: number;
        taskDifference: number;
        assignedTaskCount: number;
        assignedTaskDifference: number;
        completedTaskCount: number;
        completedTaskDifference: number;
        overdueTaskCount: number;
        overdueTaskDifference: number;
        incompleteTaskCount: number;
        incompleteTaskDifference: number;
    }
}

export const Analytics = ({ data }: AnalyticsProps) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <AnalyticsCard
                title="Total Tasks"
                value={data.taskCount}
                variant={data.taskDifference >= 0 ? "up" : "down"}
                increaseValue={data.taskDifference}
                color="blue"
            />
            <AnalyticsCard
                title="Assigned"
                value={data.assignedTaskCount}
                variant={data.assignedTaskDifference >= 0 ? "up" : "down"}
                increaseValue={data.assignedTaskDifference}
                color="violet"
            />
            <AnalyticsCard
                title="Completed"
                value={data.completedTaskCount}
                variant={data.completedTaskDifference >= 0 ? "up" : "down"}
                increaseValue={data.completedTaskDifference}
                color="emerald"
            />
            <AnalyticsCard
                title="Overdue"
                value={data.overdueTaskCount}
                variant={data.overdueTaskDifference > 0 ? "up" : "down"}
                increaseValue={data.overdueTaskDifference}
                color="red"
            />
            <AnalyticsCard
                title="Incomplete"
                value={data.incompleteTaskCount}
                variant={data.incompleteTaskDifference > 0 ? "up" : "down"}
                increaseValue={data.incompleteTaskDifference}
                color="amber"
            />
        </div>
    );
}