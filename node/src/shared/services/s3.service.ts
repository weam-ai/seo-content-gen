import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get('S3_BUCKET_NAME') || '';
    this.s3 = new S3Client({
      region: this.configService.get('S3_REGION'),
    });
  }

  async uploadFile(fileKey: string, file: Buffer): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file,
      ACL: 'public-read',
    });

    try {
      await this.s3.send(command);
      this.logger.log(`File uploaded successfully: ${fileKey}`);
      return `https://${this.bucketName}.s3.${this.configService.get('S3_REGION')}.amazonaws.com/${fileKey}`;
    } catch (error) {
      this.logger.error('Error uploading file to S3', error);
      throw error;
    }
  }

  async getFile(fileKey: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      const result = await this.s3.send(command);
      const stream = result.Body as ReadableStream;
      const buffer = await this.streamToBuffer(stream);
      return buffer;
    } catch (error) {
      this.logger.error('Error retrieving file from S3', error);
      throw error;
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      await this.s3.send(command);
      this.logger.log(`File deleted successfully: ${fileKey}`);
    } catch (error) {
      this.logger.error('Error deleting file from S3', error);
      throw error;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    try {
      const result = await this.s3.send(command);
      return result.Contents?.map((item) => item.Key ?? '') ?? [];
    } catch (error) {
      this.logger.error('Error listing files from S3', error);
      throw error;
    }
  }

  async getSignedUrl(fileKey: string, expires: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    try {
      return await getSignedUrl(this.s3, command, { expiresIn: expires });
    } catch (error) {
      this.logger.error('Error generating signed URL', error);
      throw error;
    }
  }

  private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) {
        chunks.push(value);
      }
      done = readerDone;
    }

    return Buffer.concat(chunks);
  }
}
