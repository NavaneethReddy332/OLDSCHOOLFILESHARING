import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { backblazeService } from "./backblaze";
import multer from "multer";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { insertGuestbookEntrySchema } from "@shared/schema";
import Busboy from "busboy";
import { PassThrough } from "stream";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
});

interface PendingUpload {
  code: string;
  fileName: string;
  originalName: string;
  size: number;
  contentType: string;
  timestamp: number;
  password?: string;
  maxDownloads?: number;
  isOneTime?: boolean;
}

const pendingUploads = new Map<string, PendingUpload>();

setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [code, upload] of pendingUploads.entries()) {
    if (upload.timestamp < oneHourAgo) {
      pendingUploads.delete(code);
      console.log(`[DIRECT_UPLOAD] Cleaned up expired pending upload: ${code}`);
    }
  }
}, 5 * 60 * 1000);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/upload/get-url", async (req, res) => {
    try {
      const { filename, contentType, size } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ error: "Missing filename or contentType" });
      }

      let code = generateCode();
      let existingFile = await storage.getFileByCode(code);
      
      while (existingFile) {
        code = generateCode();
        existingFile = await storage.getFileByCode(code);
      }

      const uniqueFileName = `${Date.now()}-${randomBytes(8).toString('hex')}-${filename}`;
      
      const uploadAuth = await backblazeService.getUploadUrlForBrowser();
      
      pendingUploads.set(code, {
        code,
        fileName: uniqueFileName,
        originalName: filename,
        size: parseInt(size) || 0,
        contentType,
        timestamp: Date.now(),
      });
      
      console.log(`[DIRECT_UPLOAD] Generated code ${code} for direct upload: ${filename}`);
      console.log(`[DIRECT_UPLOAD] Stored pending upload for verification`);
      
      res.json({
        code,
        uploadUrl: uploadAuth.uploadUrl,
        authToken: uploadAuth.authToken,
        fileName: uniqueFileName,
        originalName: filename,
      });
    } catch (error: any) {
      console.error('[DIRECT_UPLOAD] Failed to get upload URL:', error);
      res.status(500).json({ 
        error: "Failed to get upload URL",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/upload/finalize", async (req, res) => {
    try {
      const { code, fileName, originalName, size, contentType, fileId, password, maxDownloads, isOneTime } = req.body;
      
      if (!code || !fileName || !fileId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const pendingUpload = pendingUploads.get(code);
      if (!pendingUpload) {
        console.error(`[DIRECT_UPLOAD] Finalize rejected - no pending upload for code: ${code}`);
        return res.status(403).json({ 
          error: "Invalid upload session",
          message: "No pending upload found for this code"
        });
      }

      if (pendingUpload.fileName !== fileName) {
        console.error(`[DIRECT_UPLOAD] Finalize rejected - fileName mismatch for code: ${code}`);
        pendingUploads.delete(code);
        return res.status(403).json({ 
          error: "Invalid upload session",
          message: "File name does not match pending upload"
        });
      }

      const existingFile = await storage.getFileByCode(code);
      if (existingFile) {
        console.error(`[DIRECT_UPLOAD] Finalize rejected - code already used: ${code}`);
        pendingUploads.delete(code);
        return res.status(409).json({ 
          error: "Code already used",
          message: "This upload code has already been finalized"
        });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      let passwordHash = null;
      let isPasswordProtected = 0;
      
      if (password && password.trim() !== "") {
        passwordHash = await bcrypt.hash(password, 10);
        isPasswordProtected = 1;
        console.log(`[DIRECT_UPLOAD] Password protection enabled for ${code}`);
      }

      const dbFile = await storage.createFile({
        code,
        filename: fileName,
        originalName: originalName || pendingUpload.originalName,
        size: parseInt(size) || pendingUpload.size,
        mimetype: contentType || pendingUpload.contentType,
        expiresAt,
        passwordHash,
        isPasswordProtected,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
        isOneTime: isOneTime === 'true' || isOneTime === true ? 1 : 0,
        b2FileId: fileId,
      });

      pendingUploads.delete(code);
      console.log(`[DIRECT_UPLOAD] ✓ SUCCESS! Code: ${dbFile.code}, File: ${originalName}`);
      console.log(`[DIRECT_UPLOAD] Removed pending upload after successful finalization`);

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
      console.error('[DIRECT_UPLOAD] Finalize failed:', error);
      res.status(500).json({ 
        error: "Failed to finalize upload",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/upload", async (req, res) => {
    const startTime = Date.now();
    const busboy = Busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 1024 * 1024 * 1024,
      }
    });
    
    let uploadComplete = false;
    const formFields: Record<string, string> = {};
    
    busboy.on('field', (fieldname, value) => {
      formFields[fieldname] = value;
      console.log(`[UPLOAD] Received field: ${fieldname}`);
    });
    
    busboy.on('file', async (fieldname, fileStream, info) => {
      const receiveStartTime = Date.now();
      try {
        const { filename, encoding, mimeType } = info;
        console.log(`[UPLOAD] File stream started - File: ${filename}, Type: ${mimeType}`);
        
        let code = generateCode();
        let existingFile = await storage.getFileByCode(code);
        
        while (existingFile) {
          code = generateCode();
          existingFile = await storage.getFileByCode(code);
        }
        console.log(`[UPLOAD] Generated unique code: ${code}`);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const uniqueFileName = `${Date.now()}-${randomBytes(8).toString('hex')}-${filename}`;
        
        let uploadedSize = 0;
        const chunks: Buffer[] = [];
        
        fileStream.on('data', (chunk: Buffer) => {
          uploadedSize += chunk.length;
          chunks.push(chunk);
        });

        await new Promise<void>((resolve, reject) => {
          fileStream.on('end', () => {
            const receiveEndTime = Date.now();
            console.log(`[UPLOAD] Received from client - Size: ${uploadedSize} bytes, Time: ${receiveEndTime - receiveStartTime}ms`);
            resolve();
          });
          fileStream.on('error', reject);
        });
        
        const b2UploadStart = Date.now();
        console.log(`[UPLOAD] Uploading to Backblaze: ${uniqueFileName}, Size: ${uploadedSize} bytes`);
        
        const fileBuffer = Buffer.concat(chunks);
        const b2Upload = await backblazeService.uploadFile(
          fileBuffer,
          uniqueFileName,
          mimeType
        );
        
        const b2Duration = Date.now() - b2UploadStart;
        console.log(`[UPLOAD] Backblaze upload complete in ${b2Duration}ms: ${b2Upload.fileId}`);

        const { password, maxDownloads, isOneTime } = formFields;
        
        let passwordHash = null;
        let isPasswordProtected = 0;
        
        if (password && password.trim() !== "") {
          const hashStart = Date.now();
          passwordHash = await bcrypt.hash(password, 10);
          isPasswordProtected = 1;
          console.log(`[UPLOAD] Password hashed in ${Date.now() - hashStart}ms`);
        }

        const dbStart = Date.now();
        const dbFile = await storage.createFile({
          code,
          filename: uniqueFileName,
          originalName: filename,
          size: uploadedSize,
          mimetype: mimeType,
          expiresAt,
          passwordHash,
          isPasswordProtected,
          maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
          isOneTime: isOneTime === 'true' ? 1 : 0,
          b2FileId: b2Upload.fileId,
        });
        console.log(`[UPLOAD] Database record created in ${Date.now() - dbStart}ms`);

        const totalDuration = Date.now() - startTime;
        console.log(`[UPLOAD] ✓ SUCCESS! Code: ${dbFile.code}, Total: ${totalDuration}ms (Receive: ${receiveStartTime ? 'done' : 'N/A'}, B2: ${b2Duration}ms)`);

        uploadComplete = true;
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
        if (!uploadComplete) {
          const duration = Date.now() - startTime;
          console.error(`[UPLOAD] ✗ FAILED after ${duration}ms:`, error);
          console.error('[UPLOAD] Error stack:', error.stack);
          
          const errorMessage = error.message || "Upload failed";
          res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }
      }
    });

    busboy.on('error', (error: any) => {
      console.error('[UPLOAD] Busboy error:', error);
      if (!uploadComplete) {
        res.status(500).json({ error: "Upload stream error" });
      }
    });

    req.pipe(busboy);
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

  app.post("/api/file/:code/get-download-link", async (req, res) => {
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

  app.post("/api/download/:code", async (req, res) => {
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

      await storage.incrementDownloadCount(file.id);

      console.log(`[DOWNLOAD] Streaming file from Backblaze: ${file.filename}`);
      const fileStream = await backblazeService.downloadFileStream(file.filename);
      
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader("Content-Length", file.size);
      res.setHeader("Cache-Control", "no-cache");
      
      let streamCompleted = false;
      
      fileStream.on('end', () => {
        streamCompleted = true;
        const duration = Date.now() - startTime;
        console.log(`[DOWNLOAD] Stream completed for ${file.originalName} in ${duration}ms`);
      });

      fileStream.on('error', async (error) => {
        console.error(`[DOWNLOAD] Stream error:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download stream failed" });
        }
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

      fileStream.pipe(res);

      res.on('finish', async () => {
        if (streamCompleted && (file.isOneTime || (file.maxDownloads && file.downloadCount >= file.maxDownloads))) {
          try {
            await storage.deleteFile(file.id);
            if (file.b2FileId) {
              await backblazeService.deleteFile(file.filename, file.b2FileId);
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
