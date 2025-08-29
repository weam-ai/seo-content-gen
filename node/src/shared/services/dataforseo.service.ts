import {
  Injectable,
  HttpException,
  HttpStatus,
  Provider,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DATAFORSEO_STRING } from '../utils/string.utils';
import { logger } from '../utils/logger.utils';
import {
  DataForSeoKeyRecommendationRequest,
  DataForSeoKeyRecommendationResponse,
  KeywordMetric,
  KeywordRecommendation,
} from '../types/dataForSeo.t';
import { AxiosResponse } from 'axios';
import { DataForSeoMockService } from './dataforseo.mock.service';
import { KeywordDifficulty } from '../types/articles.t';

export interface DataForSeoServiceInterface {
  fetchKeywordMetrics(keywords: string[]): Promise<KeywordMetric[]>;
  fetchRecommendedKeywords(
    keywords: string[],
  ): Promise<KeywordRecommendation[]>;
}

@Injectable()
export class DataForSeoService implements DataForSeoServiceInterface {
  private readonly apiUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      'DATAFORSEO_API_URL',
    ) as string;
    this.username = this.configService.get<string>(
      'DATAFORSEO_USERNAME',
    ) as string;
    this.password = this.configService.get<string>(
      'DATAFORSEO_PASSWORD',
    ) as string;
  }

  async fetchKeywordMetrics(keywords: string[]): Promise<KeywordMetric[]> {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      throw new HttpException(
        DATAFORSEO_STRING.ERROR.INVALID_REQUEST,
        HttpStatus.BAD_REQUEST,
      );
    }

    const requestData = [
      {
        keywords: keywords,
        language_name: 'English',
        location_name: 'United States',
      },
    ];

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.apiUrl + '/keywords_data/google_ads/search_volume/live',
          requestData,
          {
            auth: {
              username: this.username,
              password: this.password,
            },
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      if (!response?.data?.tasks) {
        throw new HttpException(
          DATAFORSEO_STRING.ERROR.FETCH_KEYWORD_METRICS_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results: any[] = response.data.tasks[0]?.result || [];

      if (results.length === 0) {
        // Return default metrics if no results are found
        return [
          {
            keyword: keywords[0],
            keyword_volume: 0,
            keyword_difficulty: 'LOW',
          },
        ];
      }

      // Map the results to the desired format
      return results.map((item) => ({
        keyword: item.keyword,
        keyword_volume: item.search_volume || 0,
        keyword_difficulty:
          item.competition !== null ? item.competition : KeywordDifficulty.LOW,
      }));
    } catch (error) {
      logger.error('DataForSEO API Error:', error.message || error);
      return [];
      // throw new HttpException(
      //   DATAFORSEO_STRING.ERROR.FETCH_KEYWORD_METRICS_ERROR,
      //   HttpStatus.INTERNAL_SERVER_ERROR,
      // );
    }
  }

  async fetchRecommendedKeywords(
    keywords: string[],
  ): Promise<KeywordRecommendation[]> {
    const requestData: DataForSeoKeyRecommendationRequest[] = [
      {
        keywords: keywords,
        location_code: 2840,
        language_code: 'en',
        filters: ['keyword_info.search_volume', '>', '10'],
        order_by: ['keyword_info.search_volume,desc'],
        limit: 10,
      },
    ];

    const response: AxiosResponse<DataForSeoKeyRecommendationResponse> =
      await firstValueFrom(
        this.httpService.post(
          this.apiUrl + '/keywords_data/google_ads/keywords_for_keywords/live',
          requestData,
          {
            auth: {
              username: this.username,
              password: this.password,
            },
          },
        ),
      );

    if (response.status !== 200 || response.data.tasks.length === 0) {
      throw new HttpException(
        DATAFORSEO_STRING.ERROR.FETCH_KEYWORD_RECOMMENDATION_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const apiTask = response.data.tasks[0];
    if (!apiTask || !apiTask.result || !Array.isArray(apiTask.result)) {
      throw new Error(
        `Invalid API result format. [Keywords: ${keywords.join(', ')}]`,
      );
    }

    let keywordsLoaded: KeywordRecommendation[] = apiTask.result.map(
      (item) => ({
        keyword: item.keyword.trim(),
        search_volume: item.search_volume || 0,
        competition: item.competition || 'UNKNOWN',
        competition_index: item.competition_index || 0,
        cpc: item.cpc || 0,
      }),
    );

    keywordsLoaded = Array.from(
      new Map(
        keywordsLoaded.map((item) => [item.keyword.toLowerCase(), item]),
      ).values(),
    );

    return keywordsLoaded;
  }
}

export const DataForSeoProvider: Provider = {
  provide: DataForSeoService,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const useMock = configService.get('DATAFORSEO_MOCK', null) === 'true';
    return useMock
      ? new DataForSeoMockService()
      : new DataForSeoService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
