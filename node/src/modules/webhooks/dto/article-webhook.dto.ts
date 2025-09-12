import { ArticleFrom } from '@shared/types/articles.t';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GenerateArticleWebhookRequest {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  avg_word_count: number;
}