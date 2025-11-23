import { type User, type InsertUser, type File, type InsertFile, type GuestbookEntry, type InsertGuestbookEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createFile(file: InsertFile): Promise<File>;
  getFileByCode(code: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;
  cleanupExpiredFiles(): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  
  createGuestbookEntry(entry: InsertGuestbookEntry): Promise<GuestbookEntry>;
  getAllGuestbookEntries(): Promise<GuestbookEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private files: Map<string, File>;
  private filesByCode: Map<string, string>;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.filesByCode = new Map();
    
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
      downloadCount: 0,
      isPasswordProtected: insertFile.isPasswordProtected || 0,
      isOneTime: insertFile.isOneTime || 0,
      passwordHash: insertFile.passwordHash || null,
      maxDownloads: insertFile.maxDownloads || null,
    };
    this.files.set(id, file);
    this.filesByCode.set(insertFile.code, id);
    return file;
  }

  async getFileByCode(code: string): Promise<File | undefined> {
    const fileId = this.filesByCode.get(code);
    if (!fileId) return undefined;
    
    const file = this.files.get(fileId);
    if (!file) return undefined;
    
    if (file.expiresAt <= new Date()) {
      this.deleteFile(file.id);
      return undefined;
    }
    
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      this.filesByCode.delete(file.code);
    }
    this.files.delete(id);
  }

  async cleanupExpiredFiles(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.files.entries());
    for (const [id, file] of entries) {
      if (file.expiresAt <= now) {
        this.deleteFile(id);
      }
    }
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      file.downloadCount++;
      this.files.set(id, file);
    }
  }

  async createGuestbookEntry(entry: InsertGuestbookEntry): Promise<GuestbookEntry> {
    const id = randomUUID();
    const guestbookEntry: GuestbookEntry = {
      ...entry,
      id,
      createdAt: new Date(),
      isApproved: 1,
      location: entry.location || null,
      favoriteSystem: entry.favoriteSystem || null,
    };
    return guestbookEntry;
  }

  async getAllGuestbookEntries(): Promise<GuestbookEntry[]> {
    return [];
  }
}

export const storage = new MemStorage();
