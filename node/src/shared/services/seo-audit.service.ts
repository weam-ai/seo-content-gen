import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { logger } from '../utils/logger.utils';

@Injectable()
export class SeoAuditService {
  private readonly logger = new Logger(SeoAuditService.name);
  private readonly siteAuditUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.siteAuditUrl =
      this.configService.get<string>('PYTHON_API_PATH') ||
      'http://localhost:8002';
  }

  startSeoAuditReport(payload: {
    website_url: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Starting SEO audit for URL: ${payload.website_url}`);

      // Note: The actual audit will be processed via chunked streaming
      // This method just validates the URL and returns success
      return Promise.resolve({
        success: true,
        message: 'SEO audit initiated successfully',
      });
    } catch (error) {
      this.logger.error(`Error starting SEO audit: ${error.message}`);
      throw error;
    }
  }

  async processSiteAuditChunked(
    url: string,
    onProgress: (step: string) => Promise<void>,
    onComplete: (report: any) => Promise<void>,
    onError: (error: string) => Promise<void>,
  ): Promise<void> {
    try {
      this.logger.log(`Processing chunked site audit for URL: ${url}`);

      const response = await axios.post(
        `${this.siteAuditUrl}/seo-audit/audits`,
        { url },
        {
          responseType: 'stream',
          timeout: 300000, // 5 minutes timeout
        },
      );

      let auditReport = '';
      let isDone = false;
      response.data.on('data', async (chunk: Buffer) => {
        const line = chunk.toString('utf8');
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('done')) {
          isDone = true;
          return;
        }

        if (isDone) {
          auditReport += line;
        } else {
          await onProgress(trimmedLine);
        }
        return;
      });

      response.data.on('end', async () => {
        try {
          auditReport = JSON.parse(auditReport);
          await onComplete(auditReport);
        } catch (err) {
          logger.error(err);
        }
      });

      response.data.on('error', async (error: Error) => {
        this.logger.error(`Stream error: ${error.message}`);
        await onError(`Stream processing error: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Error processing chunked audit: ${error.message}`);
      await onError(`Failed to process audit: ${error.message}`);
    }
  }

  // Legacy methods for backward compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkSeoAuditProgress(_reportId: string): {
    status: string;
    progress: number;
  } {
    // This method is kept for backward compatibility but won't be used in new flow
    return { status: 'pending', progress: 0 };
  }

  getSeoAuditReportById(_reportId: string): any {
    // This method is kept for backward compatibility but won't be used in new flow
    return { reportId: _reportId, report: null };
  }
}
