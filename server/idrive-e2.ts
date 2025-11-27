import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { EventEmitter } from 'events';

interface IDriveE2Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
  region: string;
}

export interface UploadProgressEvent {
  type: 'progress' | 'complete' | 'error';
  percent?: number;
  message?: string;
  error?: string;
}

class IDriveE2Service {
  private client: S3Client;
  private config: IDriveE2Config;

  constructor(config: IDriveE2Config) {
    this.config = config;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    progressEmitter?: EventEmitter
  ): Promise<{ fileKey: string; fileName: string }> {
    try {
      if (progressEmitter) {
        progressEmitter.emit('progress', { type: 'progress', percent: 0 });
      }

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType || 'application/octet-stream',
      });

      await this.client.send(command);

      if (progressEmitter) {
        progressEmitter.emit('progress', { type: 'progress', percent: 100 });
        progressEmitter.emit('progress', { type: 'complete' });
      }

      return {
        fileKey: fileName,
        fileName: fileName,
      };
    } catch (error: any) {
      console.error('IDrive e2 upload error:', error);
      if (progressEmitter) {
        progressEmitter.emit('progress', { type: 'error', error: 'Failed to upload file to IDrive e2' });
      }
      throw new Error('Failed to upload file to IDrive e2');
    }
  }

  async uploadFileStream(
    fileStream: NodeJS.ReadableStream,
    fileName: string,
    contentType: string,
    fileSize: number,
    progressEmitter?: EventEmitter
  ): Promise<{ fileKey: string; fileName: string; uploadedBytes: number }> {
    try {
      if (progressEmitter) {
        progressEmitter.emit('progress', { type: 'progress', percent: 0 });
      }

      let uploadedBytes = 0;

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucketName,
          Key: fileName,
          Body: fileStream,
          ContentType: contentType || 'application/octet-stream',
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024, // 5MB parts
        leavePartsOnError: false,
      });

      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && fileSize > 0) {
          uploadedBytes = progress.loaded;
          const percent = Math.min(95, Math.floor((progress.loaded / fileSize) * 100));
          if (progressEmitter) {
            progressEmitter.emit('progress', { type: 'progress', percent });
          }
        }
      });

      await upload.done();

      if (progressEmitter) {
        progressEmitter.emit('progress', { type: 'progress', percent: 100 });
        progressEmitter.emit('progress', { type: 'complete' });
      }

      return {
        fileKey: fileName,
        fileName: fileName,
        uploadedBytes: uploadedBytes || fileSize,
      };
    } catch (error: any) {
      console.error('IDrive e2 upload stream error:', error);
      if (progressEmitter) {
        progressEmitter.emit('progress', { type: 'error', error: 'Failed to upload file stream to IDrive e2' });
      }
      throw new Error('Failed to upload file stream to IDrive e2');
    }
  }

  async uploadLargeFile(
    fileStream: NodeJS.ReadableStream,
    fileName: string,
    contentType: string,
    fileSize: number,
    progressEmitter?: EventEmitter
  ): Promise<{ fileKey: string; fileName: string; uploadedBytes: number }> {
    return this.uploadFileStream(fileStream, fileName, contentType, fileSize, progressEmitter);
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error('IDrive e2 download error:', error);
      throw new Error('Failed to download file from IDrive e2');
    }
  }

  async downloadFileStream(fileName: string): Promise<NodeJS.ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body');
      }

      return response.Body as NodeJS.ReadableStream;
    } catch (error: any) {
      console.error('IDrive e2 download stream error:', error);
      throw new Error('Failed to download file stream from IDrive e2');
    }
  }

  async deleteFile(fileName: string, fileKey?: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
      });

      await this.client.send(command);
    } catch (error: any) {
      console.error('IDrive e2 delete error:', error);
      throw new Error('Failed to delete file from IDrive e2');
    }
  }

  async getFileInfo(fileName: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
      });

      const response = await this.client.send(command);
      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        eTag: response.ETag,
      };
    } catch (error) {
      console.error('IDrive e2 file info error:', error);
      throw new Error('Failed to get file info from IDrive e2');
    }
  }

  getDownloadUrl(fileName: string): string {
    return `${this.config.endpoint}/${this.config.bucketName}/${fileName}`;
  }
}

const idriveE2Config: IDriveE2Config = {
  accessKeyId: process.env.IDRIVE_E2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.IDRIVE_E2_SECRET_ACCESS_KEY || '',
  endpoint: process.env.IDRIVE_E2_ENDPOINT || '',
  bucketName: process.env.IDRIVE_E2_BUCKET_NAME || '',
  region: process.env.IDRIVE_E2_REGION || 'us-east-1',
};

if (!idriveE2Config.accessKeyId || !idriveE2Config.secretAccessKey || 
    !idriveE2Config.endpoint || !idriveE2Config.bucketName) {
  console.warn('IDrive e2 credentials not configured. File uploads will fail.');
}

export const storageService = new IDriveE2Service(idriveE2Config);
