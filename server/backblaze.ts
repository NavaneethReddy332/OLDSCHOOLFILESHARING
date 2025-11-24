import B2 from 'backblaze-b2';
import { Readable } from 'stream';

interface B2Config {
  applicationKeyId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
}

class BackblazeService {
  private b2: B2;
  private config: B2Config;
  private authorizationToken: string | null = null;
  private downloadUrl: string | null = null;
  private apiUrl: string | null = null;

  constructor(config: B2Config) {
    this.config = config;
    this.b2 = new B2({
      applicationKeyId: config.applicationKeyId,
      applicationKey: config.applicationKey,
    });
  }

  async authorize(): Promise<void> {
    try {
      const response = await this.b2.authorize();
      this.authorizationToken = response.data.authorizationToken;
      this.downloadUrl = response.data.downloadUrl;
      this.apiUrl = response.data.apiUrl;
    } catch (error) {
      console.error('Backblaze authorization error:', error);
      throw new Error('Failed to authorize with Backblaze');
    }
  }

  async ensureAuthorized(): Promise<void> {
    if (!this.authorizationToken) {
      await this.authorize();
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<{ fileId: string; fileName: string }> {
    await this.ensureAuthorized();

    try {
      const uploadUrlResponse = await this.b2.getUploadUrl({
        bucketId: this.config.bucketId,
      });

      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrlResponse.data.uploadUrl,
        uploadAuthToken: uploadUrlResponse.data.authorizationToken,
        fileName: fileName,
        data: fileBuffer,
        contentType: contentType,
      });

      return {
        fileId: uploadResponse.data.fileId,
        fileName: uploadResponse.data.fileName,
      };
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
        this.authorizationToken = null;
        await this.ensureAuthorized();
        return this.uploadFile(fileBuffer, fileName, contentType);
      }
      console.error('Backblaze upload error:', error);
      throw new Error('Failed to upload file to Backblaze');
    }
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    await this.ensureAuthorized();

    try {
      const response = await this.b2.downloadFileByName({
        bucketName: this.config.bucketName,
        fileName: fileName,
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
        this.authorizationToken = null;
        await this.ensureAuthorized();
        return this.downloadFile(fileName);
      }
      console.error('Backblaze download error:', error);
      throw new Error('Failed to download file from Backblaze');
    }
  }

  async downloadFileStream(fileName: string): Promise<NodeJS.ReadableStream> {
    await this.ensureAuthorized();

    try {
      const response = await this.b2.downloadFileByName({
        bucketName: this.config.bucketName,
        fileName: fileName,
        responseType: 'stream',
      });

      return response.data as any;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
        this.authorizationToken = null;
        await this.ensureAuthorized();
        return this.downloadFileStream(fileName);
      }
      console.error('Backblaze download stream error:', error);
      throw new Error('Failed to download file stream from Backblaze');
    }
  }

  async deleteFile(fileName: string, fileId: string): Promise<void> {
    await this.ensureAuthorized();

    try {
      await this.b2.deleteFileVersion({
        fileId: fileId,
        fileName: fileName,
      });
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
        this.authorizationToken = null;
        await this.ensureAuthorized();
        return this.deleteFile(fileName, fileId);
      }
      console.error('Backblaze delete error:', error);
      throw new Error('Failed to delete file from Backblaze');
    }
  }

  async getFileInfo(fileId: string): Promise<any> {
    await this.ensureAuthorized();

    try {
      const response = await this.b2.getFileInfo({
        fileId: fileId,
      });
      return response.data;
    } catch (error) {
      console.error('Backblaze file info error:', error);
      throw new Error('Failed to get file info from Backblaze');
    }
  }

  getDownloadUrl(fileName: string): string {
    if (!this.downloadUrl) {
      throw new Error('Not authorized with Backblaze');
    }
    return `${this.downloadUrl}/file/${this.config.bucketName}/${fileName}`;
  }

  async getDownloadAuthorization(fileName: string, validDurationInSeconds: number = 3600): Promise<string> {
    await this.ensureAuthorized();

    if (!this.apiUrl) {
      throw new Error('Not authorized with Backblaze');
    }

    try {
      const response = await fetch(`${this.apiUrl}/b2api/v2/b2_get_download_authorization`, {
        method: 'POST',
        headers: {
          'Authorization': this.authorizationToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: this.config.bucketId,
          fileNamePrefix: fileName,
          validDurationInSeconds: validDurationInSeconds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`B2 download authorization failed: ${errorText}`);
      }

      const data = await response.json();
      return data.authorizationToken;
    } catch (error: any) {
      console.error('Backblaze download authorization error:', error);
      throw new Error('Failed to get download authorization from Backblaze');
    }
  }

  getAuthorizedDownloadUrl(fileName: string, authToken: string): string {
    if (!this.downloadUrl) {
      throw new Error('Not authorized with Backblaze');
    }
    return `${this.downloadUrl}/file/${this.config.bucketName}/${fileName}?Authorization=${authToken}`;
  }
}

const backblazeConfig: B2Config = {
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || '',
  bucketId: process.env.B2_BUCKET_ID || '',
  bucketName: process.env.B2_BUCKET_NAME || '',
};

if (!backblazeConfig.applicationKeyId || !backblazeConfig.applicationKey || 
    !backblazeConfig.bucketId || !backblazeConfig.bucketName) {
  console.warn('Backblaze credentials not configured. File uploads will fail.');
}

export const backblazeService = new BackblazeService(backblazeConfig);
