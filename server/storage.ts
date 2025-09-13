import { 
  users, 
  projects, 
  boards, 
  tasks, 
  projectMembers, 
  taskComments,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Board,
  type InsertBoard,
  type Task,
  type InsertTask,
  type ProjectMember,
  type InsertProjectMember,
  type TaskComment,
  type InsertTaskComment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  
  // Board operations
  getBoards(projectId: string): Promise<Board[]>;
  getBoard(id: string): Promise<Board | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: string): Promise<void>;
  
  // Task operations
  getTasks(boardId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // Project member operations
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  
  // Comment operations
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // Initialize admin user
  initializeAdmin(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProjects(userId: string): Promise<Project[]> {
    // Get projects where user is owner or member
    const userProjects = await db
      .select({ project: projects })
      .from(projects)
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        eq(projects.ownerId, userId)
      )
      .orderBy(desc(projects.createdAt));

    const memberProjects = await db
      .select({ project: projects })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projects.createdAt));

    // Combine and deduplicate
    const allProjects = [...userProjects.map(p => p.project), ...memberProjects.map(p => p.project)];
    const uniqueProjects = Array.from(new Map(allProjects.map(p => [p.id, p])).values());
    
    return uniqueProjects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject || undefined;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getBoards(projectId: string): Promise<Board[]> {
    return await db
      .select()
      .from(boards)
      .where(eq(boards.projectId, projectId))
      .orderBy(asc(boards.position));
  }

  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board || undefined;
  }

  async createBoard(board: InsertBoard): Promise<Board> {
    const [newBoard] = await db
      .insert(boards)
      .values(board)
      .returning();
    return newBoard;
  }

  async updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board | undefined> {
    const [updatedBoard] = await db
      .update(boards)
      .set(board)
      .where(eq(boards.id, id))
      .returning();
    return updatedBoard || undefined;
  }

  async deleteBoard(id: string): Promise<void> {
    await db.delete(boards).where(eq(boards.id, id));
  }

  async getTasks(boardId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.boardId, boardId))
      .orderBy(asc(tasks.position));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        updatedAt: new Date(),
      })
      .returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...task,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db
      .insert(projectMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));
  }

  async createComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db
      .insert(taskComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async initializeAdmin(): Promise<void> {
    const adminEmail = "axelencore@mail.ru";
    const existingAdmin = await this.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      // Hash the admin password
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const password = "Ad580dc6axelencore";
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      await this.createUser({
        email: adminEmail,
        password: hashedPassword,
        name: "Axel Encore",
        role: "admin",
      });
    }
  }
}

export const storage = new DatabaseStorage();
