import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Extended request interface to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Base authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Role-based access control middleware
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
}

// Project access middleware - verifies user owns or is member of project
export async function requireProjectAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const projectId = req.params.projectId || req.params.id;
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    try {
      // Get project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is owner
      if (project.ownerId === req.user!.id) {
        return next();
      }

      // Check if user is a member
      const members = await storage.getProjectMembers(projectId);
      const isMember = members.some(member => member.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Access denied: not a project member" });
      }

      next();
    } catch (error) {
      console.error("Project access check failed:", error);
      res.status(500).json({ message: "Failed to verify project access" });
    }
}

// Board access middleware - verifies user has access to board's project
export async function requireBoardAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const boardId = req.params.boardId || req.params.id;
    
    if (!boardId) {
      return res.status(400).json({ message: "Board ID is required" });
    }

    try {
      // Get board
      const board = await storage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      // Get project and check access
      const project = await storage.getProject(board.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is project owner
      if (project.ownerId === req.user!.id) {
        return next();
      }

      // Check if user is project member
      const members = await storage.getProjectMembers(board.projectId);
      const isMember = members.some(member => member.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Access denied: not a project member" });
      }

      next();
    } catch (error) {
      console.error("Board access check failed:", error);
      res.status(500).json({ message: "Failed to verify board access" });
    }
}

// Task access middleware - verifies user has access to task's project
export async function requireTaskAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const taskId = req.params.id;
    
    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    try {
      // Get task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Get board
      const board = await storage.getBoard(task.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      // Get project and check access
      const project = await storage.getProject(board.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is project owner
      if (project.ownerId === req.user!.id) {
        return next();
      }

      // Check if user is project member
      const members = await storage.getProjectMembers(board.projectId);
      const isMember = members.some(member => member.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Access denied: not a project member" });
      }

      next();
    } catch (error) {
      console.error("Task access check failed:", error);
      res.status(500).json({ message: "Failed to verify task access" });
    }
}

// Task modification middleware - only allows task creator, assignee, or project owner/members
export async function requireTaskModifyAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const taskId = req.params.id;
    
    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    try {
      // Get task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user is task creator or assignee
      if (task.createdById === req.user!.id || task.assigneeId === req.user!.id) {
        return next();
      }

      // Get board and project to check ownership/membership
      const board = await storage.getBoard(task.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const project = await storage.getProject(board.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is project owner
      if (project.ownerId === req.user!.id) {
        return next();
      }

      // Check if user is project member with manager+ role
      const members = await storage.getProjectMembers(board.projectId);
      const memberInfo = members.find(member => member.userId === req.user!.id);
      
      if (!memberInfo) {
        return res.status(403).json({ message: "Access denied: not a project member" });
      }

      // Allow managers and owners to modify tasks
      if (memberInfo.role === "manager" || memberInfo.role === "owner") {
        return next();
      }

      // Regular members can only modify their own tasks
      return res.status(403).json({ message: "Access denied: insufficient permissions to modify this task" });

    } catch (error) {
      console.error("Task modify access check failed:", error);
      res.status(500).json({ message: "Failed to verify task modify access" });
    }
}

// Project creation middleware - restrict who can create projects
export function requireProjectCreateAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Allow admins and managers to create projects, regular users can also create their own
  if (req.user.role === "admin" || req.user.role === "manager" || req.user.role === "user") {
    return next();
  }

  return res.status(403).json({ message: "Access denied: insufficient permissions to create projects" });
}

// Board/Task creation middleware - requires project membership
export async function requireProjectMembershipForCreation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    try {
      // Get project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is project owner
      if (project.ownerId === req.user!.id) {
        return next();
      }

      // Check if user is project member
      const members = await storage.getProjectMembers(projectId);
      const memberInfo = members.find(member => member.userId === req.user!.id);
      
      if (!memberInfo) {
        return res.status(403).json({ message: "Access denied: not a project member" });
      }

      next();
    } catch (error) {
      console.error("Project membership check failed:", error);
      res.status(500).json({ message: "Failed to verify project membership" });
    }
}