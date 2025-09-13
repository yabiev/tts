import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface KanbanBoardProps {
  boardId: string;
  className?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export function KanbanBoard({ boardId, className }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/boards", boardId, "tasks"],
    enabled: !!boardId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "tasks"] });
    },
  });

  const columns: KanbanColumn[] = [
    {
      id: "todo",
      title: "To Do",
      color: "bg-muted",
      tasks: tasks.filter(task => task.status === "todo"),
    },
    {
      id: "in-progress", 
      title: "In Progress",
      color: "bg-accent",
      tasks: tasks.filter(task => task.status === "in-progress"),
    },
    {
      id: "review",
      title: "Review", 
      color: "bg-yellow-500",
      tasks: tasks.filter(task => task.status === "review"),
    },
    {
      id: "done",
      title: "Done",
      color: "bg-green-500", 
      tasks: tasks.filter(task => task.status === "done"),
    },
  ];

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (columnId: string) => {
    if (draggedTask && draggedTask.status !== columnId) {
      updateTaskMutation.mutate({
        taskId: draggedTask.id,
        updates: { status: columnId as Task["status"] },
      });
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-blue-500/20 text-blue-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "high": return "bg-orange-500/20 text-orange-400";
      case "critical": return "bg-red-500/20 text-red-400";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getTagColor = (index: number) => {
    const colors = [
      "bg-primary/20 text-primary",
      "bg-accent/20 text-accent", 
      "bg-green-500/20 text-green-400",
      "bg-purple-500/20 text-purple-400",
      "bg-orange-500/20 text-orange-400",
    ];
    return colors[index % colors.length];
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("flex space-x-6 h-full min-w-max pb-6", className)}>
      {columns.map((column) => (
        <div
          key={column.id}
          className="kanban-column w-80 rounded-xl p-4 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(column.id)}
          data-testid={`kanban-column-${column.id}`}
        >
          {/* Column header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={cn("w-3 h-3 rounded-full", column.color)}></div>
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="bg-muted/20 text-muted-foreground">
                {column.tasks.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              data-testid={`button-add-task-${column.id}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Tasks */}
          <div className="space-y-3 flex-1">
            {column.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center mb-2">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-sm">No tasks yet</p>
              </div>
            ) : (
              column.tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "task-card p-4 rounded-lg cursor-pointer transition-all",
                    column.id === "done" && "opacity-75",
                    draggedTask?.id === task.id && "opacity-50"
                  )}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={handleDragEnd}
                  data-testid={`task-${task.id}`}
                >
                  {/* Task header */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={cn(
                      "font-medium leading-tight",
                      column.id === "done" && "line-through"
                    )}>
                      {task.title}
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground w-6 h-6 p-0"
                      data-testid={`task-menu-${task.id}`}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Task description */}
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Progress bar for in-progress tasks */}
                  {column.id === "in-progress" && task.progress > 0 && (
                    <div className="w-full bg-muted/20 rounded-full h-2 mb-3">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Task footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Priority badge */}
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getPriorityColor(task.priority))}
                      >
                        {column.id === "done" ? "✓" : ""} {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Assignee avatar */}
                      {task.assigneeId && (
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {getInitials("John Doe")}
                          </span>
                        </div>
                      )}
                      
                      {/* Due date */}
                      {task.dueDate && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
