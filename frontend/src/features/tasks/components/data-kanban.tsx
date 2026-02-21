import React, { useCallback, useEffect, useState, useMemo } from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import { Task, TaskStatus, Epic } from "../types";
import { KanbanColumnHeader } from "./kanban-column-header";
import { KanbanCard } from "./kanban-card";
import { Layers } from "lucide-react";

// Map design columns to task statuses
const columnStatusMap: Record<string, TaskStatus[]> = {
  "new-task": [TaskStatus.TODO],
  "scheduled": [TaskStatus.IN_REVIEW],
  "in-progress": [TaskStatus.IN_PROGRESS],
  "completed": [TaskStatus.DONE],
};

const statusToColumn = (status: TaskStatus): string => {
  for (const [column, statuses] of Object.entries(columnStatusMap)) {
    if (statuses.includes(status)) {
      return column;
    }
  }
  return "new-task";
};

const columnToStatus = (column: string): TaskStatus => {
  const statuses = columnStatusMap[column];
  return statuses[0] || TaskStatus.TODO;
};

const boards: string[] = ["new-task", "scheduled", "in-progress", "completed"];

type ColumnTasks = {
  [column: string]: Task[];
};

interface DataKanbanProps {
  data: Task[];
  onChange: (tasks: { $id: string; status: TaskStatus; position: number; }[]) => void;
  groupBy?: "status" | "epic";
  epics?: Epic[];
}

// Epic header shown above task cards when groupBy=epic
function EpicHeader({ epicName }: { epicName: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 mb-1 rounded bg-indigo-50 border border-indigo-100">
      <Layers size={12} className="text-indigo-400" />
      <span className="text-xs font-medium text-indigo-700 truncate">{epicName}</span>
    </div>
  );
}

export const DataKanban = ({ data, onChange, groupBy = "status", epics = [] }: DataKanbanProps) => {
  const [tasks, setTasks] = useState<ColumnTasks>(() => {
    const initialTasks: ColumnTasks = {
      "new-task": [],
      "scheduled": [],
      "in-progress": [],
      "completed": [],
    };

    data.forEach((task) => {
      const column = statusToColumn(task.status);
      if (initialTasks[column]) {
        initialTasks[column].push(task);
      }
    });

    Object.keys(initialTasks).forEach((column) => {
      initialTasks[column].sort((a, b) => a.position - b.position);
    });

    return initialTasks;
  });

  // Build epic lookup
  const epicMap = useMemo(() => {
    const map = new Map<string, Epic>();
    for (const epic of epics) {
      map.set(epic.id, epic);
    }
    return map;
  }, [epics]);

  useEffect(() => {
    const newTasks: ColumnTasks = {
      "new-task": [],
      "scheduled": [],
      "in-progress": [],
      "completed": [],
    };

    data.forEach((task) => {
      const column = statusToColumn(task.status);
      if (newTasks[column]) {
        newTasks[column].push(task);
      }
    });

    Object.keys(newTasks).forEach((column) => {
      newTasks[column].sort((a, b) => a.position - b.position);
    });

    setTasks(newTasks);
  }, [data]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    const updatesPayload: { $id: string; status: TaskStatus; position: number; }[] = [];

    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };

      const sourceTasks = [...newTasks[sourceColumn]];
      const [movedTask] = sourceTasks.splice(source.index, 1);

      if (!movedTask) {
        console.error("No task found at source index");
        return prevTasks;
      }

      const newStatus = columnToStatus(destColumn);
      const updatedMovedTask = { ...movedTask, status: newStatus };

      newTasks[sourceColumn] = sourceTasks;

      const destTasks = [...newTasks[destColumn]];
      destTasks.splice(destination.index, 0, updatedMovedTask);
      newTasks[destColumn] = destTasks;

      updatesPayload.push({
        $id: updatedMovedTask.$id,
        status: newStatus,
        position: Math.min((destination.index + 1) * 1000, 1_000_000)
      });

      newTasks[destColumn].forEach((task, index) => {
        if (task && task.$id !== updatedMovedTask.$id) {
          const newPosition = Math.min((index + 1) * 1000, 1_000_000);
          if (task.position !== newPosition) {
            updatesPayload.push({
              $id: task.$id,
              status: task.status,
              position: newPosition
            });
          }
        }
      });

      if (sourceColumn !== destColumn) {
        newTasks[sourceColumn].forEach((task, index) => {
          if (task) {
            const newPosition = Math.min((index + 1) * 1000, 1_000_000);
            if (task.position !== newPosition) {
              updatesPayload.push({
                $id: task.$id,
                status: task.status,
                position: newPosition,
              });
            }
          }
        });
      }

      return newTasks;
    });

    onChange(updatesPayload);
  }, [onChange]);

  // Group column tasks by epic for rendering epic headers
  const getEpicGroupedColumnTasks = useCallback(
    (columnTasks: Task[]) => {
      if (groupBy !== "epic" || epics.length === 0) return null;

      const groups: { epicName: string; tasks: Task[] }[] = [];
      const epicBuckets = new Map<string, Task[]>();
      const ungrouped: Task[] = [];

      for (const task of columnTasks) {
        const epicId = (task as any).epicId || (task as any).epic_id;
        if (epicId && epicMap.has(epicId)) {
          if (!epicBuckets.has(epicId)) epicBuckets.set(epicId, []);
          epicBuckets.get(epicId)!.push(task);
        } else {
          ungrouped.push(task);
        }
      }

      for (const [epicId, tasks] of epicBuckets) {
        groups.push({ epicName: epicMap.get(epicId)?.name ?? "Unknown", tasks });
      }
      if (ungrouped.length > 0) {
        groups.push({ epicName: "Ungrouped", tasks: ungrouped });
      }

      return groups;
    },
    [groupBy, epics, epicMap]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto gap-4 pb-4 min-w-0">
        {boards.map((board) => {
          const columnTasks = tasks[board] || [];
          const epicGroups = getEpicGroupedColumnTasks(columnTasks);

          return (
            <div
              key={board}
              className="flex-1 bg-muted p-1.5 rounded-md min-w-[200px]"
            >
              <KanbanColumnHeader
                board={board}
                taskCount={columnTasks.length}
              />
              <Droppable droppableId={board}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px] py-1.5"
                  >
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No tasks
                      </div>
                    ) : epicGroups ? (
                      // Render with epic headers
                      (() => {
                        let globalIndex = 0;
                        return epicGroups.map((group) => (
                          <div key={group.epicName} className="mb-2">
                            <EpicHeader epicName={group.epicName} />
                            {group.tasks.map((task) => {
                              const idx = globalIndex++;
                              return (
                                <Draggable key={task.$id} draggableId={task.$id} index={idx}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <KanbanCard task={task} />
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                          </div>
                        ));
                      })()
                    ) : (
                      columnTasks.map((task, index) => (
                        <Draggable key={task.$id} draggableId={task.$id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <KanbanCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
