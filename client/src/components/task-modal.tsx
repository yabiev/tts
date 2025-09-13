import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertTask } from "@shared/schema";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  initialStatus?: "todo" | "in-progress" | "review" | "done";
}

export function TaskModal({ isOpen, onClose, boardId, initialStatus = "todo" }: TaskModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    status: initialStatus,
    dueDate: "",
    assigneeId: "",
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Omit<InsertTask, "createdById" | "boardId">) => {
      const res = await apiRequest("POST", `/api/boards/${boardId}/tasks`, {
        ...data,
        boardId,
        createdById: user!.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "tasks"] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      status: initialStatus,
      dueDate: "",
      assigneeId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      assigneeId: formData.assigneeId || null,
      position: 0, // Default position
      progress: 0, // Default progress
    };

    createTaskMutation.mutate(taskData);
  };

  const handleClose = () => {
    onClose();
    resetForm();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-create-task">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              type="text"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-input border-border"
              data-testid="input-task-title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              rows={4}
              placeholder="Describe the task in detail..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-input border-border resize-none"
              data-testid="input-task-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger className="bg-input border-border" data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Critical</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="bg-input border-border"
                data-testid="input-task-due-date"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className="bg-input border-border" data-testid="select-task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {/* Mock assignees - replace with real user selection */}
              <Badge variant="secondary" className="bg-primary/20 text-primary flex items-center space-x-2 px-3 py-1">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span>{user?.name || "You"}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-4 h-4 p-0 text-primary/70 hover:text-primary"
                  data-testid="remove-assignee"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              data-testid="button-add-assignee"
            >
              + Add assignee
            </Button>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-border"
              data-testid="button-cancel-task"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="glass-button"
              disabled={createTaskMutation.isPending}
              data-testid="button-create-task"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
