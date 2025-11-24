import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { backblazeService } from "./backblaze";
import multer from "multer";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { insertGuestbookEntrySchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let code = generateCode();
      let existingFile = await storage.getFileByCode(code);
      
      while (existingFile) {
        code = generateCode();
        existingFile = await storage.getFileByCode(code);
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { password, maxDownloads, isOneTime } = req.body;
      
      let passwordHash = null;
      let isPasswordProtected = 0;
      
      if (password && password.trim() !== "") {
        passwordHash = await bcrypt.hash(password, 10);
        isPasswordProtected = 1;
      }

      const uniqueFileName = `${Date.now()}-${randomBytes(8).toString('hex')}-${req.file.originalname}`;
      
      const b2Upload = await backblazeService.uploadFile(
        req.file.buffer,
        uniqueFileName,
        req.file.mimetype
      );

      const file = await storage.createFile({
        code,
        filename: uniqueFileName,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        expiresAt,
        passwordHash,
        isPasswordProtected,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
        isOneTime: isOneTime === 'true' || isOneTime === true ? 1 : 0,
        b2FileId: b2Upload.fileId,
      });

      res.json({
        code: file.code,
        originalName: file.originalName,
        size: file.size,
        expiresAt: file.expiresAt,
        isPasswordProtected: file.isPasswordProtected,
        maxDownloads: file.maxDownloads,
        isOneTime: file.isOneTime,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.get("/api/file/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!code || code.length !== 6) {
        return res.status(400).json({ error: "Invalid code format" });
      }

      const file = await storage.getFileByCode(code);

      if (!file) {
        return res.status(404).json({ error: "File not found or expired" });
      }

      const remainingDownloads = file.maxDownloads 
        ? file.maxDownloads - file.downloadCount 
        : null;

      res.json({
        code: file.code,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: file.uploadedAt,
        expiresAt: file.expiresAt,
        isPasswordProtected: file.isPasswordProtected,
        downloadCount: file.downloadCount,
        maxDownloads: file.maxDownloads,
        remainingDownloads,
        isOneTime: file.isOneTime,
      });
    } catch (error) {
      console.error("File lookup error:", error);
      res.status(500).json({ error: "Failed to retrieve file information" });
    }
  });

  app.post("/api/file/:code/verify", async (req, res) => {
    try {
      const { code } = req.params;
      const { password } = req.body;

      const file = await storage.getFileByCode(code);

      if (!file) {
        return res.status(404).json({ error: "File not found or expired" });
      }

      if (!file.isPasswordProtected) {
        return res.json({ success: true });
      }

      if (!password) {
        return res.status(401).json({ error: "Password required" });
      }

      const isValid = await bcrypt.compare(password, file.passwordHash || "");
      
      if (!isValid) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Password verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/download/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { password } = req.body;
      
      const file = await storage.getFileByCode(code);

      if (!file) {
        return res.status(404).json({ error: "File not found or expired" });
      }

      if (file.isPasswordProtected) {
        if (!password) {
          return res.status(401).json({ error: "Password required" });
        }
        const isValid = await bcrypt.compare(password, file.passwordHash || "");
        if (!isValid) {
          return res.status(401).json({ error: "Incorrect password" });
        }
      }

      if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
        return res.status(403).json({ error: "Download limit reached" });
      }

      await storage.incrementDownloadCount(file.id);

      const fileBuffer = await backblazeService.downloadFile(file.filename);
      
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader("Content-Length", file.size);
      
      res.send(fileBuffer);
      
      if (file.isOneTime || (file.maxDownloads && file.downloadCount + 1 >= file.maxDownloads)) {
        try {
          await storage.deleteFile(file.id);
          if (file.b2FileId) {
            await backblazeService.deleteFile(file.filename, file.b2FileId);
          }
        } catch (deleteError) {
          console.error("File cleanup error:", deleteError);
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Download failed" });
    }
  });

  app.get("/api/guestbook", async (req, res) => {
    try {
      const entries = await storage.getAllGuestbookEntries();
      res.json(entries);
    } catch (error) {
      console.error("Guestbook fetch error:", error);
      res.status(500).json({ error: "Failed to fetch guestbook entries" });
    }
  });

  app.post("/api/guestbook", async (req, res) => {
    try {
      const result = insertGuestbookEntrySchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid guestbook entry data" });
      }

      const entry = await storage.createGuestbookEntry(result.data);
      res.json(entry);
    } catch (error) {
      console.error("Guestbook post error:", error);
      res.status(500).json({ error: "Failed to create guestbook entry" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
