import { ArticleFrom } from '@shared/types/articles.t';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GenerateArticleWebhookRequest {
  @IsNotEmpty()
  requestId: string;

  @IsEnum(ArticleFrom)
  @IsNotEmpty()
  model: ArticleFrom;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  avg_word_count: number;
}