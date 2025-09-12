import { ArticleFrom, TargetedKeyword } from './articles.t';

export type FetchSiteMapResponse = {
  site_urls: string;
  total_pages: number;
  contain_types: {
    type: string;
    count: number;
  }[];
};

export type SitemapDetailedInterface = {
  url: string;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  error: string | null;
  content_type: string | null;
};

export type GenerateArticlePayload = {
  articleId: string;
  model?: ArticleFrom;
};

export type GenerateTitlePayload = {
  ProjectId: string;
  Keywords?: TargetedKeyword[];
};

export type GenerateOutlinePayload = { articleId: string };

export type GenerateCompanyDetailResponse = {
  company_name: string | null;
  company_details: string | null;
  owner_bio: string | null;
  target_audience: string | null;
};
