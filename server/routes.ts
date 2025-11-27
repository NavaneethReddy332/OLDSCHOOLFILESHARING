import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { storageService } from "./idrive-e2";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { insertGuestbookEntrySchema } from "@shared/schema";
import { 
  passwordVerificationLimiter, 
  downloadLimiter, 
  uploadLimiter, 
  codeLookupLimiter 
} from "./middleware/rateLimiter";
import { validateFile } from "./middleware/fileValidation";
import { validateExpirationHours } from "./middleware/expirationValidator";

interface PendingUpload {
  uploadId: string;
  fileKey: string;
  originalName: string;
  size: number;
  mimetype: string;
  expiresInHours: number;
  password?: string;
  maxDownloads?: number;
  isOneTime: boolean;
  createdAt: Date;
}

const pendingUploads = new Map<string, PendingUpload>();

setInterval(() => {
  const now = Date.now();
  Array.from(pendingUploads.entries()).forEach(([uploadId, upload]) => {
    if (now - upload.createdAt.getTime() > 15 * 60 * 1000) {
      pendingUploads.delete(uploadId);
      storageService.deleteFile(upload.fileKey).catch(() => {});
    }
  });
}, 60000);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/uploads/presign", uploadLimiter, async (req, res) => {
    try {
      const { filename, size, mimetype, expiresIn, password, maxDownloads, isOneTime } = req.body;

      if (!filename || !size || !mimetype) {
        return res.status(400).json({ error: "Missing required fields: filename, size, mimetype" });
      }

      if (!storageService.isConfigured()) {
        return res.status(503).json({ error: "Storage service not configured" });
      }

      const validation = validateFile(filename, mimetype, size);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const expiresInHours = validateExpirationHours(expiresIn);
      const uploadId = randomBytes(16).toString('hex');
      const uniqueFileName = `${Date.now()}-${randomBytes(8).toString('hex')}-${filename}`;

      const { uploadUrl, fileKey } = await storageService.generatePresignedUploadUrl(
        uniqueFileName,
        mimetype,
        600
      );

      pendingUploads.set(uploadId, {
        uploadId,
        fileKey,
        originalName: filename,
        size,
        mimetype,
        expiresInHours,
        password: password || undefined,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : undefined,
        isOneTime: isOneTime === true || isOneTime === 'true',
        createdAt: new Date(),
      });

      console.log(`[PRESIGN] Generated presigned URL for ${filename}, uploadId: ${uploadId}`);

      res.json({
        uploadId,
        uploadUrl,
        fileKey,
      });
    } catch (error: any) {
      console.error("[PRESIGN] Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate presigned URL" });
    }
  });

  app.post("/api/uploads/complete", uploadLimiter, async (req, res) => {
    try {
      const { uploadId } = req.body;

      if (!uploadId) {
        return res.status(400).json({ error: "Missing uploadId" });
      }

      const pendingUpload = pendingUploads.get(uploadId);
      if (!pendingUpload) {
        return res.status(404).json({ error: "Upload not found or expired" });
      }

      const { verified, actualSize } = await storageService.verifyUpload(
        pendingUpload.fileKey,
        pendingUpload.size
      );

      if (!verified) {
        pendingUploads.delete(uploadId);
        await storageService.deleteFile(pendingUpload.fileKey).catch(() => {});
        return res.status(400).json({ 
          error: `File verification failed. Expected ${pendingUpload.size} bytes, found ${actualSize} bytes` 
        });
      }

      let code = generateCode();
      let existingFile = await storage.getFileByCode(code);
      while (existingFile) {
        code = generateCode();
        existingFile = await storage.getFileByCode(code);
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + pendingUpload.expiresInHours);

      let passwordHash = null;
      let isPasswordProtected = 0;
      if (pendingUpload.password && pendingUpload.password.trim() !== "") {
        passwordHash = await bcrypt.hash(pendingUpload.password, 10);
        isPasswordProtected = 1;
      }

      const dbFile = await storage.createFile({
        code,
        filename: pendingUpload.fileKey,
        originalName: pendingUpload.originalName,
        size: pendingUpload.size,
        mimetype: pendingUpload.mimetype,
        expiresAt,
        passwordHash,
        isPasswordProtected,
        maxDownloads: pendingUpload.maxDownloads || null,
        isOneTime: pendingUpload.isOneTime ? 1 : 0,
        b2FileId: pendingUpload.fileKey,
      });

      pendingUploads.delete(uploadId);

      console.log(`[COMPLETE] Upload complete for ${pendingUpload.originalName}, code: ${code}`);

      res.json({
        code: dbFile.code,
        originalName: dbFile.originalName,
        size: dbFile.size,
        expiresAt: dbFile.expiresAt,
        isPasswordProtected: dbFile.isPasswordProtected,
        maxDownloads: dbFile.maxDownloads,
        isOneTime: dbFile.isOneTime,
      });
    } catch (error: any) {
      console.error("[COMPLETE] Error:", error);
      res.status(500).json({ error: error.message || "Failed to complete upload" });
    }
  });

  app.post("/api/uploads/abort", async (req, res) => {
    try {
      const { uploadId } = req.body;

      if (!uploadId) {
        return res.status(400).json({ error: "Missing uploadId" });
      }

      const pendingUpload = pendingUploads.get(uploadId);
      if (pendingUpload) {
        pendingUploads.delete(uploadId);
        await storageService.deleteFile(pendingUpload.fileKey).catch(() => {});
        console.log(`[ABORT] Upload aborted for uploadId: ${uploadId}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[ABORT] Error:", error);
      res.status(500).json({ error: error.message || "Failed to abort upload" });
    }
  });

  app.get("/api/file/:code", codeLookupLimiter, async (req, res) => {
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

  app.post("/api/file/:code/verify", passwordVerificationLimiter, async (req, res) => {
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

  app.post("/api/file/:code/get-download-link", passwordVerificationLimiter, async (req, res) => {
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

      const baseUrl = req.protocol + '://' + req.get('host');
      const downloadUrl = `${baseUrl}/download/${code}`;

      res.json({
        downloadUrl,
        filename: file.originalName,
        requiresPassword: file.isPasswordProtected === 1,
      });
    } catch (error) {
      console.error("Get download link error:", error);
      res.status(500).json({ error: "Failed to generate download link" });
    }
  });

  app.get("/api/download-direct/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      const file = await storage.getFileByCode(code);

      if (!file) {
        return res.status(404).send("<h1>404 - File Not Found</h1><p>This file may have expired or been deleted.</p>");
      }

      // Redirect all direct download links to the download center page
      // This prevents auto-downloading and lets users see file details first
      return res.redirect(302, `/download/${code}`);
    } catch (error) {
      console.error("Direct download redirect error:", error);
      res.status(500).send("<h1>Error</h1><p>An error occurred while processing your request.</p>");
    }
  });

  app.post("/api/download/:code", downloadLimiter, async (req, res) => {
    const startTime = Date.now();
    try {
      const { code } = req.params;
      const { password } = req.body;
      
      console.log(`[DOWNLOAD] Starting download for code: ${code}`);
      
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

      // Increment download count BEFORE streaming
      await storage.incrementDownloadCount(file.id);
      const currentDownloadCount = file.downloadCount + 1;

      console.log(`[DOWNLOAD] Streaming file from IDrive e2: ${file.filename}`);
      
      let fileStream;
      try {
        fileStream = await storageService.downloadFileStream(file.filename);
      } catch (streamError) {
        console.error(`[DOWNLOAD] Failed to get stream from IDrive e2:`, streamError);
        // Rollback download count if we can't get the stream
        await storage.incrementDownloadCount(file.id, -1);
        return res.status(500).json({ error: "Failed to retrieve file from storage" });
      }
      
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader("Content-Length", file.size);
      res.setHeader("Cache-Control", "no-cache");
      
      let streamCompleted = false;
      let bytesTransferred = 0;
      
      // Track actual bytes transferred
      fileStream.on('data', (chunk: Buffer) => {
        bytesTransferred += chunk.length;
      });
      
      fileStream.on('end', () => {
        streamCompleted = true;
        const duration = Date.now() - startTime;
        console.log(`[DOWNLOAD] Stream completed for ${file.originalName} in ${duration}ms (${bytesTransferred} bytes)`);
      });

      fileStream.on('error', async (error) => {
        console.error(`[DOWNLOAD] Stream error:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download stream failed" });
        }
        // Rollback if stream failed before completion
        if (!streamCompleted) {
          try {
            await storage.incrementDownloadCount(file.id, -1);
            console.log(`[DOWNLOAD] Rolled back download count due to stream error`);
          } catch (rollbackError) {
            console.error(`[DOWNLOAD] Failed to rollback download count:`, rollbackError);
          }
        }
        res.destroy();
      });

      // Handle client disconnect
      res.on('close', async () => {
        if (!streamCompleted && res.writableEnded === false) {
          console.log(`[DOWNLOAD] Client disconnected before completion`);
          try {
            await storage.incrementDownloadCount(file.id, -1);
            console.log(`[DOWNLOAD] Rolled back download count due to client disconnect`);
          } catch (rollbackError) {
            console.error(`[DOWNLOAD] Failed to rollback download count:`, rollbackError);
          }
        }
      });

      fileStream.pipe(res);

      res.on('finish', async () => {
        if (streamCompleted && (file.isOneTime || (file.maxDownloads && currentDownloadCount >= file.maxDownloads))) {
          try {
            await storage.deleteFile(file.id);
            if (file.b2FileId) {
              await storageService.deleteFile(file.filename);
            }
            console.log(`[DOWNLOAD] File deleted after download: ${file.originalName}`);
          } catch (deleteError) {
            console.error("File cleanup error:", deleteError);
          }
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[DOWNLOAD] Failed after ${duration}ms:`, error);
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
  
  httpServer.timeout = 600000;
  httpServer.keepAliveTimeout = 610000;
  httpServer.headersTimeout = 620000;

  return httpServer;
}
