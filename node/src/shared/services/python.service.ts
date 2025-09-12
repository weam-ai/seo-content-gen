import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import {
  FetchSiteMapResponse,
  GenerateArticlePayload,
  GenerateCompanyDetailResponse,
  GenerateOutlinePayload,
  GenerateTitlePayload,
  SitemapDetailedInterface,
} from '../types/python.t';
import { logger } from '../utils/logger.utils';
import { createAxiosWithLogging } from '../utils/axios.util';
// EmailService import removed - email functionality not supported

@Injectable()
export class PythonService {
  private readonly axiosInstance: AxiosInstance;
  private readonly serviceLogEmail: string[];

  // Debounce mechanism for error notifications
  private emailDebounceMap = new Map<
    string,
    {
      lastEmailSent: number;
      errorCount: number;
      debounceTimeMs: number;
    }
  >();

  private readonly outlineRequestCache = new Map<
    string,
    Promise<string | null>
  >();
  private readonly sitemapCache = new Map<
    string,
    Promise<FetchSiteMapResponse>
  >();
  private readonly detailedSitemapCache = new Map<
    string,
    Promise<SitemapDetailedInterface[]>
  >();

  constructor(
    private readonly configService: ConfigService,
    // private readonly emailService: EmailService, // Removed - email functionality not supported
  ) {
    const baseURL = this.configService.get<string>('PYTHON_API_PATH') || '';
    this.axiosInstance = createAxiosWithLogging({ baseURL }, 'PythonAPI');

    this.serviceLogEmail = this.configService
      .get('SERVICE_LOG_EMAILS', '')
      .split(',')
      .map((email: string): string => email.trim());
  }

  async fetchSiteMap(company_name: string): Promise<FetchSiteMapResponse> {
    if (this.sitemapCache.has(company_name)) {
      return this.sitemapCache.get(company_name)!;
    }

    const promise = this.axiosInstance
      .post<FetchSiteMapResponse>('/fetch-sitemaps', { company_name })
      .then((res) => res.data)
      .catch((error) => {
        logger.error(error);
        void this.sendPythonErrorNotification(
          '/fetch-sitemaps',
          { company_name },
          error,
        );
        throw error;
      })
      .finally(() => {
        this.sitemapCache.delete(company_name);
      });

    this.sitemapCache.set(company_name, promise);
    return promise;
  }

  async fetchDetailedSitemap(
    url: string,
    cb?: () => void,
  ): Promise<SitemapDetailedInterface[]> {
    if (this.detailedSitemapCache.has(url)) {
      return this.detailedSitemapCache.get(url)!;
    }

    const promise = this.axiosInstance
      .post<SitemapDetailedInterface[]>('/sitemap', { url })
      .then((res) => res.data)
      .catch((error) => {
        logger.error(error);
        void this.sendPythonErrorNotification('/sitemap', { url }, error);
        throw error;
      })
      .finally(() => {
        this.detailedSitemapCache.delete(url);
      });

    this.detailedSitemapCache.set(url, promise);

    //callback to start process after sitemap crawl completed
    if (cb) void cb();
    return promise;
  }

  async generateArticle(payload: GenerateArticlePayload) {
    try {
      logger.log(
        'info',
        `Python service requested on [/generate-article, ${JSON.stringify(payload)}]`,
      );
      return this.axiosInstance.post<{
        webhook_responses: { open_ai: string };
      }>('/get-articles', payload);
    } catch (error) {
      logger.error(error);
      void this.sendPythonErrorNotification('/get-articles', payload, error);
      return null;
    }
  }

  async generateTitles(
    payload: GenerateTitlePayload,
  ): Promise<string[] | null> {
    try {
      const response = await this.axiosInstance.post<string[]>(
        '/get-titles',
        payload,
      );
      return response.data;
    } catch (error) {
      logger.error(error);
      void this.sendPythonErrorNotification('/get-titles', payload, error);
      return null;
    }
  }

  async generateOutline(
    payload: GenerateOutlinePayload,
  ): Promise<string | null> {
    const cacheKey = `${payload.articleId}`;

    if (this.outlineRequestCache.has(cacheKey)) {
      return this.outlineRequestCache.get(cacheKey)!;
    }

    const promise = this.axiosInstance
      .post<string>('/generate-outline', payload)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error);
        void this.sendPythonErrorNotification(
          '/generate-outline',
          payload,
          error,
        );
        return null;
      })
      .finally(() => {
        this.outlineRequestCache.delete(cacheKey);
      });

    this.outlineRequestCache.set(cacheKey, promise);
    return promise;
  }

  async checkExistingProjectTitle(
    projectId: string,
    title: string
  ): Promise<string | null> {
    const payload = { ProjectId: projectId, title };

    try {
      const response = await this.axiosInstance.post<string | null>(
        '/check-title',
        payload,
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Error in check existing project title: payload [${JSON.stringify(payload)}], `,
        error,
      );
      return null;
    }
  }
  //company-business-summary
  async companyBusinessSummary(
    websiteUrl: string,
  ): Promise<GenerateCompanyDetailResponse> {
    const payload = { 
      company_name: websiteUrl,
      company_website: websiteUrl 
    };
    try {
      const response =
        await this.axiosInstance.post<GenerateCompanyDetailResponse>(
          '/company-business-summary',
          payload,
        );
      return response.data;
    } catch (error) {
      logger.error(
        `Error in generate business description: payload [${JSON.stringify(payload)}], `,
        error,
      );
      return {
        company_details: null,
        company_name: null,
        owner_bio: null,
        target_audience: null,
      };
    }
  }

  private async sendPythonErrorNotification(
    endpoint: string,
    payload: any,
    error: any,
  ): Promise<void> {
    if (!this.serviceLogEmail) {
      logger.warn(
        'SERVICE_LOG_EMAIL not configured, skipping Python error notification',
      );
      return;
    }

    try {
      // Debounce logic - 5 minutes (300000 ms) between emails per endpoint
      const debounceKey = `${endpoint}`;
      const now = Date.now();
      const debounceTimeMs = 5 * 60 * 1000; // 5 minutes

      let debounceInfo = this.emailDebounceMap.get(debounceKey);

      if (!debounceInfo) {
        debounceInfo = {
          lastEmailSent: 0,
          errorCount: 0,
          debounceTimeMs,
        };
        this.emailDebounceMap.set(debounceKey, debounceInfo);
      }

      // Increment error count
      debounceInfo.errorCount++;

      // Check if we should send email (first error or 5 minutes have passed)
      const shouldSendEmail =
        debounceInfo.lastEmailSent === 0 ||
        now - debounceInfo.lastEmailSent > debounceInfo.debounceTimeMs;

      if (!shouldSendEmail) {
        logger.info(
          `Python error notification for ${endpoint} debounced. Total errors since last notification: ${debounceInfo.errorCount}`,
        );
        return;
      }
      const previousErrorCount = debounceInfo.errorCount;

      // Reset debounce info
      debounceInfo.lastEmailSent = now;
      debounceInfo.errorCount = 0;

      // Email notification removed - not supported in single-user application
      logger.error(`Python Service API Failure: ${endpoint}`, {
        error: JSON.stringify(error, null, 2),
          payload: JSON.stringify(payload, null, 2),
          service: 'Python API',
          errorCount: previousErrorCount,
          timeSinceLastEmail: previousErrorCount > 1 ? `${Math.floor((now - (debounceInfo.lastEmailSent || 0)) / 1000)} seconds` : 'First error occurrence',
          timestamp: new Date().toISOString(),
        },
      );
      logger.info(
        `Python error notification sent to ${this.serviceLogEmail.join(', ')} for endpoint: ${endpoint}. ` +
          `Total errors since last notification: ${previousErrorCount}`,
      );
    } catch (emailError) {
      logger.error(
        'Failed to send Python error notification email:',
        emailError,
      );
    }
  }
}
