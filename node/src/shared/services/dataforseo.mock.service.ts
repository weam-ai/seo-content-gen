import { Injectable } from '@nestjs/common';
import { KeywordMetric } from '../types/dataForSeo.t';
import { DataForSeoServiceInterface } from './dataforseo.service';

@Injectable()
export class DataForSeoMockService implements DataForSeoServiceInterface {
  async fetchKeywordMetrics(keywords: string[]): Promise<KeywordMetric[]> {
    return Promise.all(
      keywords.map((keyword) => ({
        keyword: keyword,
        keyword_volume: Math.floor(Math.random() * 10000),
        keyword_difficulty: (['HIGH', 'MEDIUM', 'LOW'] as const)[
          Math.floor(Math.random() * 3)
        ],
      })),
    );
  }

  async fetchRecommendedKeywords(keywords: string[]) {
    const mockKeywords = [
      'digital marketing',
      'seo services',
      'content strategy',
      'social media marketing',
      'email campaigns',
      ...keywords,
    ];

    return Promise.all(
      mockKeywords.map((keyword) => ({
        keyword,
        search_volume: Math.floor(Math.random() * 10000),
        competition: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        competition_index: Math.random(),
        cpc: Math.random() * 5,
      })),
    );
  }
}
