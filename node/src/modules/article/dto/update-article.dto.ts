import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleDto } from './create-article.dto';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ArticleStatus } from '@/shared/types/articles.t';
import { ArticleSettings } from '@/shared/types/articles.t';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  // Removed assigned_members field - no longer supported

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  // Removed assign_followers field - functionality no longer supported

  // Override project_id to make it optional for updates
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsMongoId({ message: 'project_id must be a valid mongodb id' })
  project_id?: string;

  @IsOptional()
  @IsUrl()
  published_url?: string;

  @IsOptional()
  is_outline_generated?: boolean;

  @IsOptional()
  @IsString()
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  settings?: ArticleSettings;
}
