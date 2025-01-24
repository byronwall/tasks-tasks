import { format } from "date-fns";
import { Link, Plus, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { DateInput } from "~/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

interface CreateTimeBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
}

const generateRandomHslColor = () => {
  const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
  return `hsl(${hue}, 70%, 50%)`; // Fixed saturation and lightness for consistency
};

export function CreateTimeBlockDialog({
  isOpen,
  onClose,
  workspaceId,
  startTime,
  endTime,
  dayOfWeek,
}: CreateTimeBlockDialogProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(generateRandomHslColor()); // Initialize with random HSL color
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(startTime);
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(endTime);
  const [startTimeStr, setStartTimeStr] = useState(format(startTime, "HH:mm"));
  const [endTimeStr, setEndTimeStr] = useState(format(endTime, "HH:mm"));
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: tasks } = api.task.getTasks.useQuery({
    showCompleted: false,
    workspaceId,
  });

  const createTimeBlock = api.timeBlock.create.useMutation();
  const assignTask = api.timeBlock.assignTask.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const [startHours = 0, startMinutes = 0] = startTimeStr
      .split(":")
      .map(Number);
    const [endHours = 0, endMinutes = 0] = endTimeStr.split(":").map(Number);

    const finalStartTime = new Date(selectedStartDate);
    finalStartTime.setHours(startHours, startMinutes);

    const finalEndTime = new Date(selectedEndDate);
    finalEndTime.setHours(endHours, endMinutes);

    const timeBlock = await createTimeBlock.mutateAsync({
      workspaceId,
      title: title || "Untitled Block",
      startTime: finalStartTime,
      endTime: finalEndTime,
      dayOfWeek,
      color,
    });

    if (selectedTaskId) {
      await assignTask.mutateAsync({
        timeBlockId: timeBlock.id,
        taskId: selectedTaskId,
      });
    }

    onClose();
    setTitle("");
    setSelectedTaskId(null);
    setSelectedTaskTitle("");
  };

  const handleTaskSelect = (taskId: number, taskTitle: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskTitle(taskTitle);
    setIsSearchOpen(false);
  };

  const clearSelectedTask = () => {
    setSelectedTaskId(null);
    setSelectedTaskTitle("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Time Block</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Block Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Block title"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link Task</label>
              {selectedTaskId ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{selectedTaskTitle}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelectedTask}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search tasks..."
                    onFocus={() => setIsSearchOpen(true)}
                    value={selectedTaskTitle}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {isSearchOpen && (
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search tasks..." />
                  <CommandList>
                    <CommandEmpty>No tasks found.</CommandEmpty>
                    <CommandGroup>
                      {tasks?.map((task) => (
                        <CommandItem
                          key={task.task_id}
                          onSelect={() =>
                            handleTaskSelect(task.task_id, task.title)
                          }
                        >
                          {task.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start</label>
                <div className="flex gap-2">
                  <DateInput
                    value={selectedStartDate}
                    onChange={(date) => date && setSelectedStartDate(date)}
                  />
                  <Input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End</label>
                <div className="flex gap-2">
                  <DateInput
                    value={selectedEndDate}
                    onChange={(date) => date && setSelectedEndDate(date)}
                  />
                  <Input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={/hsl\((\d+)/.exec(color)?.[1] ?? "0"}
                  onChange={(e) => setColor(`hsl(${e.target.value}, 70%, 50%)`)}
                  className="h-2 w-full appearance-none rounded-lg [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right,
                      hsl(0, 70%, 50%),
                      hsl(60, 70%, 50%),
                      hsl(120, 70%, 50%),
                      hsl(180, 70%, 50%),
                      hsl(240, 70%, 50%),
                      hsl(300, 70%, 50%),
                      hsl(360, 70%, 50%))`,
                  }}
                />
                <div
                  className="h-8 w-16 rounded-md border shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
