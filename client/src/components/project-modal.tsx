import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertProject } from "@shared/schema";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const projectColors = [
  { value: "#8B5CF6", label: "Purple", className: "bg-purple-500" },
  { value: "#3B82F6", label: "Blue", className: "bg-blue-500" },
  { value: "#10B981", label: "Green", className: "bg-green-500" },
  { value: "#F59E0B", label: "Orange", className: "bg-orange-500" },
  { value: "#EF4444", label: "Red", className: "bg-red-500" },
];

export function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#8B5CF6",
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: Omit<InsertProject, "ownerId">) => {
      const res = await apiRequest("POST", "/api/projects", {
        ...data,
        ownerId: user!.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#8B5CF6",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(formData);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-create-project">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              type="text"
              placeholder="Enter project name..."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-input border-border"
              data-testid="input-project-name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              rows={3}
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-input border-border resize-none"
              data-testid="input-project-description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-color">Project Color</Label>
            <Select 
              value={formData.color} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
            >
              <SelectTrigger className="bg-input border-border" data-testid="select-project-color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${color.className}`}></div>
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-border"
              data-testid="button-cancel-project"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="glass-button"
              disabled={createProjectMutation.isPending}
              data-testid="button-create-project-submit"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}