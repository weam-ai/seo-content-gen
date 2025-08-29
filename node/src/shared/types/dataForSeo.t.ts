export type DataForSeoKeyRecommendationRequest = {
  keywords: string[];
  location_code: number;
  language_code: string;
  filters: string[];
  order_by: string[];
  limit: number;
};

export type DataForSeoKeyRecommendationResult = {
  keyword: string;
  search_volume: number;
  competition: string;
  competition_index: number;
  cpc: number;
};

export type DataForSeoKeyRecommendationResponse = {
  tasks: {
    result: DataForSeoKeyRecommendationResult[];
  }[];
};

export interface KeywordMetric {
  keyword: string;
  keyword_volume: number;
  keyword_difficulty: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type KeywordRecommendation = {
  keyword: string;
  search_volume: number;
  competition: string;
  competition_index: number;
  cpc: number;
};
