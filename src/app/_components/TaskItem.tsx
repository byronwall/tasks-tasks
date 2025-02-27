import { Checkbox } from "~/components/ui/checkbox";
import { useSelectedTasksStore } from "~/stores/useSelectedTasksStore";

import { CreateChildTaskDialog } from "./CreateChildTaskDialog";
import { TaskActions } from "./TaskActions";
import { TaskField } from "./TaskField";
import { type Task } from "./TaskList";

export function TaskItem({
  task,
  selectedColumns,
  showFieldNames,
  indentLevel = 0,
}: {
  task: Task;
  selectedColumns: string[];
  showFieldNames: boolean;
  indentLevel?: number;
}) {
  const { toggleTask, selectedTasks } = useSelectedTasksStore();

  const isSelected = selectedTasks.has(task.task_id);

  const totalColumns = 2 + selectedColumns.length + 1;

  return (
    <div
      className="col-span-full grid grid-cols-subgrid items-center gap-2 rounded-lg border px-2 py-1"
      style={{
        gridColumnStart: `${1}`,
        gridColumnEnd: `${totalColumns + 1}`,
      }}
    >
      <div style={{ paddingLeft: `${indentLevel * 20}px` }}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleTask(task.task_id)}
          className="h-4 w-4"
        />
      </div>
      <CreateChildTaskDialog
        parentTaskId={task.task_id}
        projectId={task.projectId}
      />

      {selectedColumns.map((field) => (
        <TaskField
          key={field}
          task={task}
          field={field as keyof Task}
          showLabel={showFieldNames}
        />
      ))}

      <TaskActions task={task} />
    </div>
  );
}
