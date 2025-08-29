import { KeywordDifficulty } from '@shared/types/articles.t';
import {
  IsString,
  IsMongoId,
  IsArray,
  IsOptional,
  IsUrl,
  IsEnum,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { ArticleSettings } from '@/shared/types/articles.t';

export class CreateArticleDto {
  @IsString()
  name: string;

  @IsMongoId()
  project_id: string;

  // Removed assigned_members and assign_followers fields - functionality no longer supported

  @IsString()
  description: string;

  @IsString()
  keywords: string;

  @IsUrl()
  @IsOptional()
  website_url?: string;

  @IsNumberString()
  keyword_volume: number;

  @IsEnum(KeywordDifficulty)
  @IsOptional()
  keyword_difficulty: KeywordDifficulty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  secondary_keywords: string[];

  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  competitors_websites?: string[];

  @IsString()
  @IsOptional()
  generated_outline?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;



  // @IsString()
  // @IsOptional()
  // author_bio?: string; // Author bio functionality removed

  @IsOptional()
  settings?: ArticleSettings;
}
