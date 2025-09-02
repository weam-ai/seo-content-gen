import { TargetedKeyword } from '@/shared/types/articles.t';
import { KeywordMetric } from '@shared/types/dataForSeo.t';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsJSON,
  ValidateNested,
  IsNotEmpty,
  IsMongoId,
  IsUrl,
} from 'class-validator';

export class TargetedKeywordDto {
  @IsString()
  keyword: string;

  @IsString()
  @IsNotEmpty()
  promptTypeId: string;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitors_websites?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetedKeywordDto)
  targeted_keywords?: TargetedKeyword[];

  @IsOptional()
  @IsArray()
  @IsJSON({ each: true })
  keywords?: KeywordMetric[];

  @IsOptional()
  @IsUrl()
  website_url?: string;

  @IsOptional()
  @IsString()
  topic_titles?: string;

  @IsString()
  language: string;

  @IsArray()
  @IsString({ each: true })
  location: string[];

  @IsString()
  guideline_id: string;

  @IsString()
  guideline_description: string;

  @IsString()
  targeted_audience: string;

  @IsOptional()
  @IsString()
  sitemapdata?: string;

  @IsOptional()
  @IsString()
  detailedsitemap?: string;

  // Removed assign_to field

  @IsOptional()
  @IsString()
  organization_archetype?: string;

  @IsOptional()
  @IsString()
  brand_spokesperson?: string;

  @IsOptional()
  @IsString()
  most_important_thing?: string;

  @IsOptional()
  @IsString()
  unique_differentiator?: string;

  // @IsOptional()
  // @IsString()
  // author_bio?: string; // Author bio functionality removed
}
