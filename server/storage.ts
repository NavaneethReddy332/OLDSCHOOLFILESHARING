import { type User, type InsertUser, type File, type InsertFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createFile(file: InsertFile): Promise<File>;
  getFileByCode(code: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;
  cleanupExpiredFiles(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private files: Map<string, File>;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 60000);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = { 
      ...insertFile, 
      id,
      uploadedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async getFileByCode(code: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(
      (file) => file.code === code && file.expiresAt > new Date(),
    );
  }

  async deleteFile(id: string): Promise<void> {
    this.files.delete(id);
  }

  async cleanupExpiredFiles(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.files.entries());
    for (const [id, file] of entries) {
      if (file.expiresAt <= now) {
        this.files.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
