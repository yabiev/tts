import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Columns, 
  Calendar, 
  Users, 
  Settings, 
  Cog, 
  Plus, 
  Sparkles,
  LogOut,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, Board } from "@shared/schema";
import { ProjectModal } from "./project-modal";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProjectColor = (color: string) => {
    const colors: Record<string, string> = {
      "#8B5CF6": "from-purple-500 to-pink-500",
      "#3B82F6": "from-blue-500 to-cyan-500", 
      "#10B981": "from-green-500 to-emerald-500",
      "#F59E0B": "from-yellow-500 to-orange-500",
      "#EF4444": "from-red-500 to-pink-500",
    };
    return colors[color] || "from-purple-500 to-pink-500";
  };

  if (!user) return null;

  return (
    <aside className={cn("w-80 bg-card/50 backdrop-blur-lg border-r border-border flex flex-col", className)}>
      {/* Sidebar header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Encore Tasks</h2>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2 mb-8">
          <Button 
            variant="ghost" 
            className="sidebar-item w-full justify-start active"
            data-testid="nav-home"
          >
            <Home className="w-5 h-5 mr-3" />
            Главная
          </Button>
          <Button 
            variant="ghost" 
            className="sidebar-item w-full justify-start"
            data-testid="nav-boards"
          >
            <Columns className="w-5 h-5 mr-3" />
            Доски
            <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary">
              {projects.length}
            </Badge>
          </Button>
          <Button 
            variant="ghost" 
            className="sidebar-item w-full justify-start"
            data-testid="nav-calendar"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Календарь
          </Button>
          <Button 
            variant="ghost" 
            className="sidebar-item w-full justify-start"
            data-testid="nav-team"
          >
            <Users className="w-5 h-5 mr-3" />
            Команда
            <Badge variant="secondary" className="ml-auto bg-accent/20 text-accent">8</Badge>
          </Button>
          {user.role === "admin" && (
            <Button 
              variant="ghost" 
              className="sidebar-item w-full justify-start"
              data-testid="nav-admin"
            >
              <Cog className="w-5 h-5 mr-3" />
              Администрирование
            </Button>
          )}
          <Button 
            variant="ghost" 
            className="sidebar-item w-full justify-start"
            data-testid="nav-settings"
          >
            <Settings className="w-5 h-5 mr-3" />
            Настройки
          </Button>
        </div>

        {/* Projects section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Проекты
            </h3>
            <Button 
              size="sm" 
              variant="ghost"
              className="w-6 h-6 p-0 bg-primary/20 hover:bg-primary/30 rounded-full"
              onClick={() => setIsProjectModalOpen(true)}
              data-testid="button-create-project"
            >
              <Plus className="w-3 h-3 text-primary" />
            </Button>
          </div>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects yet
              </p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="project-item w-full justify-start p-3 h-auto"
                    onClick={() => toggleProject(project.id)}
                    data-testid={`project-${project.id}`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-gradient-to-r",
                        getProjectColor(project.color)
                      )}>
                        {getInitials(project.name)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Project
                        </p>
                      </div>
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Boards section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Доски
            </h3>
            <Button 
              size="sm" 
              variant="ghost"
              className="w-6 h-6 p-0 bg-accent/20 hover:bg-accent/30 rounded-full"
              data-testid="button-create-board"
            >
              <Plus className="w-3 h-3 text-accent" />
            </Button>
          </div>
          <div className="space-y-2">
            {/* Sample boards - replace with real data */}
            <Button
              variant="ghost"
              className="project-item w-full justify-between p-3 h-auto"
              data-testid="board-sprint-planning"
            >
              <span className="font-medium">Sprint Planning</span>
              <span className="text-xs text-muted-foreground">24</span>
            </Button>
            <Button
              variant="ghost"
              className="project-item w-full justify-between p-3 h-auto"
              data-testid="board-bug-tracking"
            >
              <span className="font-medium">Bug Tracking</span>
              <span className="text-xs text-muted-foreground">12</span>
            </Button>
            <Button
              variant="ghost"
              className="project-item w-full justify-between p-3 h-auto"
              data-testid="board-feature-requests"
            >
              <span className="font-medium">Feature Requests</span>
              <span className="text-xs text-muted-foreground">8</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            className="text-muted-foreground hover:text-foreground"
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Project creation modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </aside>
  );
}
