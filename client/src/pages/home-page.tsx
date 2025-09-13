import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/sidebar";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskModal } from "@/components/task-modal";
import { Search, Grid3X3, List, Calendar, Plus } from "lucide-react";
import { Project, Board } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // For demo purposes, we'll use a default board ID
  // In a real app, this would come from routing or selection
  const defaultBoardId = "demo-board-1";

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const currentBoard = {
    id: defaultBoardId,
    name: "Website Redesign - Sprint Planning",
    lastUpdated: "2 hours ago",
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-card/30 backdrop-blur-lg border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold" data-testid="current-board-name">
              {currentBoard.name}
            </h1>
            <div className="flex items-center space-x-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Active
              </Badge>
              <span className="text-sm text-muted-foreground" data-testid="board-last-updated">
                Updated {currentBoard.lastUpdated}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-input border-border"
                data-testid="search-tasks"
              />
            </div>
            
            {/* View options */}
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 text-primary hover:bg-primary/10"
                data-testid="view-kanban"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 text-muted-foreground hover:bg-muted/10"
                data-testid="view-list"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 text-muted-foreground hover:bg-muted/10"
                data-testid="view-calendar"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Add task button */}
            <Button 
              className="glass-button flex items-center space-x-2"
              onClick={() => setIsTaskModalOpen(true)}
              data-testid="button-add-task"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </header>

        {/* Kanban board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <KanbanBoard 
            boardId={defaultBoardId} 
            className="min-h-full"
          />
        </div>
      </main>

      {/* Task creation modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={defaultBoardId}
      />
    </div>
  );
}
