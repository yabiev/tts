import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProjectSchema, insertBoardSchema, insertTaskSchema } from "@shared/schema";
import { 
  requireAuth,
  requireRole,
  requireProjectAccess,
  requireBoardAccess,
  requireTaskAccess,
  requireTaskModifyAccess,
  requireProjectCreateAccess,
  requireProjectMembershipForCreation
} from "./auth-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize admin user
  await storage.initializeAdmin();
  
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAuth, requireProjectCreateAccess, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        ownerId: req.user!.id,
      });
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.get("/api/projects/:id", requireAuth, requireProjectAccess, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, requireProjectAccess, async (req, res) => {
    try {
      // Only project owner or admins can update projects
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only project owner or admins can update projects" });
      }
      
      const updatedProject = await storage.updateProject(req.params.id, req.body);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, requireProjectAccess, async (req, res) => {
    try {
      // Only project owner or admins can delete projects
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only project owner or admins can delete projects" });
      }
      
      await storage.deleteProject(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Board routes
  app.get("/api/projects/:projectId/boards", requireAuth, requireProjectAccess, async (req, res) => {
    try {
      const boards = await storage.getBoards(req.params.projectId);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.post("/api/projects/:projectId/boards", requireAuth, requireProjectMembershipForCreation, async (req, res) => {
    try {
      const validatedData = insertBoardSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      
      const board = await storage.createBoard(validatedData);
      res.status(201).json(board);
    } catch (error) {
      res.status(400).json({ message: "Invalid board data" });
    }
  });

  app.patch("/api/boards/:id", requireAuth, requireBoardAccess, async (req, res) => {
    try {
      // Check if user has permission to update board (owner or manager)
      const board = await storage.getBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      
      const project = await storage.getProject(board.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only project owner, managers, or admins can update boards
      if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
        const members = await storage.getProjectMembers(board.projectId);
        const memberInfo = members.find(member => member.userId === req.user!.id);
        
        if (!memberInfo || (memberInfo.role !== "manager" && memberInfo.role !== "owner")) {
          return res.status(403).json({ message: "Only project owner, managers, or admins can update boards" });
        }
      }
      
      const updatedBoard = await storage.updateBoard(req.params.id, req.body);
      if (!updatedBoard) {
        return res.status(404).json({ message: "Board not found" });
      }
      res.json(updatedBoard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  app.delete("/api/boards/:id", requireAuth, requireBoardAccess, async (req, res) => {
    try {
      // Check if user has permission to delete board (owner or manager)
      const board = await storage.getBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      
      const project = await storage.getProject(board.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only project owner, managers, or admins can delete boards
      if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
        const members = await storage.getProjectMembers(board.projectId);
        const memberInfo = members.find(member => member.userId === req.user!.id);
        
        if (!memberInfo || (memberInfo.role !== "manager" && memberInfo.role !== "owner")) {
          return res.status(403).json({ message: "Only project owner, managers, or admins can delete boards" });
        }
      }
      
      await storage.deleteBoard(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  // Task routes
  app.get("/api/boards/:boardId/tasks", requireAuth, requireBoardAccess, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.params.boardId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/boards/:boardId/tasks", requireAuth, requireBoardAccess, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        boardId: req.params.boardId,
        createdById: req.user!.id,
      });
      
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, requireTaskModifyAccess, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, requireTaskModifyAccess, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Project member management routes
  app.get("/api/projects/:id/members", requireAuth, requireProjectAccess, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      // Only project owner or admins can add members
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only project owner or admins can add members" });
      }
      
      const member = await storage.addProjectMember({
        projectId: req.params.id,
        userId: req.body.userId,
        role: req.body.role || "member"
      });
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to add project member" });
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", requireAuth, async (req, res) => {
    try {
      // Only project owner or admins can remove members
      const project = await storage.getProject(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only project owner or admins can remove members" });
      }
      
      await storage.removeProjectMember(req.params.projectId, req.params.userId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove project member" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
