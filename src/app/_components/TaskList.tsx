"use client";

import {
  BarChart3,
  GanttChart,
  Grid2X2,
  KanbanSquare,
  LayoutGrid,
  ListIcon,
  TableIcon,
} from "lucide-react";
import { useState } from "react";

import { useSearch } from "~/components/SearchContext";
import { Button } from "~/components/ui/button";
import {
  useSyncViewSettingsWithUrl,
  useUpdateUrlFromViewSettings,
  useViewSettingsStore,
} from "~/stores/useViewSettingsStore";
import { api, type RouterOutputs } from "~/trpc/react";

import { TaskCardList } from "./TaskCardList";
import { TaskGanttChart } from "./TaskGanttChart";
import { TaskItemList } from "./TaskItemList";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskListHeader } from "./TaskListHeader";
import { TaskMatrixView } from "./TaskMatrixView";
import { TaskSummaryView } from "./TaskSummaryView";
import { TaskTable } from "./TaskTable";

type TaskListProps = {
  workspaceId: string | null;
  projectId: string | null;
};

export type Task = RouterOutputs["task"]["getTasks"][number];

export function TaskList({ workspaceId, projectId }: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const { viewMode, showCompleted, showFieldNames, setViewMode } =
    useViewSettingsStore();
  const { searchQuery } = useSearch();

  // Sync view settings with URL
  useSyncViewSettingsWithUrl();
  useUpdateUrlFromViewSettings();

  const { data: rawTasks } = api.task.getTasks.useQuery({
    showCompleted,
    projectId: projectId ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });

  const searchResults = rawTasks?.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const { data: categories = [] } = api.task.getCategories.useQuery();

  const tasks = searchQuery ? (searchResults ?? []) : (rawTasks ?? []);

  const bulkDeleteTasksMutation = api.task.bulkDeleteTasks.useMutation();
  const bulkUpdateTaskCategoryMutation =
    api.task.bulkUpdateTaskCategory.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();

  const toggleTaskSelection = (taskIds: number[]) => {
    const newSelectedTasks = new Set(selectedTasks);

    if (taskIds[0] === -1) {
      // special case to clear
      setSelectedTasks(new Set());
      return;
    }

    // Process all IDs at once
    taskIds.forEach((taskId) => {
      if (newSelectedTasks.has(taskId)) {
        newSelectedTasks.delete(taskId);
      } else {
        newSelectedTasks.add(taskId);
      }
    });

    setSelectedTasks(newSelectedTasks);
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedTasks.size} tasks?`,
      )
    ) {
      await bulkDeleteTasksMutation.mutateAsync({
        taskIds: Array.from(selectedTasks),
      });
      setSelectedTasks(new Set());
    }
  };

  const handleBulkCategoryUpdate = async (category: string) => {
    await bulkUpdateTaskCategoryMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      category,
    });
    setSelectedTasks(new Set());
  };

  const handleBulkMoveToProject = async (projectId: string | null) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      projectId,
    });
    setSelectedTasks(new Set());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "summary" ? "default" : "outline"}
            onClick={() => setViewMode("summary")}
          >
            <BarChart3 className="h-4 w-4" /> Summary
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="h-4 w-4" /> List
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4" /> Table
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" /> Cards
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-4 w-4" /> Kanban
          </Button>
          <Button
            variant={viewMode === "gantt" ? "default" : "outline"}
            onClick={() => setViewMode("gantt")}
          >
            <GanttChart className="h-4 w-4" /> Gantt
          </Button>
          <Button
            variant={viewMode === "matrix" ? "default" : "outline"}
            onClick={() => setViewMode("matrix")}
          >
            <Grid2X2 className="h-4 w-4" /> Matrix
          </Button>
        </div>
      </div>
      <TaskListHeader
        selectedTasks={selectedTasks}
        onBulkDelete={handleBulkDelete}
        onBulkCategoryUpdate={handleBulkCategoryUpdate}
        onBulkMoveToProject={handleBulkMoveToProject}
        categories={categories}
        totalTasks={tasks.length}
        onToggleSelectAll={() => {
          const allTaskIds = tasks.map((t) => t.task_id);
          const isAllSelected = allTaskIds.every((id) => selectedTasks.has(id));

          if (isAllSelected) {
            toggleTaskSelection([-1]); // signal to clear
          } else {
            // Select all tasks that aren't currently selected
            const unselectedTasks = allTaskIds.filter(
              (id) => !selectedTasks.has(id),
            );
            toggleTaskSelection(unselectedTasks);
          }
        }}
      />
      {viewMode === "list" ? (
        <TaskItemList
          tasks={tasks}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleTaskSelection}
          showFieldNames={showFieldNames}
        />
      ) : viewMode === "table" ? (
        <TaskTable
          tasks={tasks}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleTaskSelection}
        />
      ) : viewMode === "card" ? (
        <TaskCardList
          tasks={tasks}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleTaskSelection}
        />
      ) : viewMode === "kanban" ? (
        <TaskKanbanView tasks={tasks} />
      ) : viewMode === "gantt" ? (
        <TaskGanttChart tasks={tasks} />
      ) : viewMode === "matrix" ? (
        <TaskMatrixView tasks={tasks} />
      ) : viewMode === "summary" ? (
        <TaskSummaryView tasks={tasks} />
      ) : null}
    </div>
  );
}
