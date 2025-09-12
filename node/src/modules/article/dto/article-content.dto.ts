import { ArticleFrom } from '@shared/types/articles.t';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SelectArticleContent {
  @IsEnum(ArticleFrom)
  @IsNotEmpty()
  selected_content: ArticleFrom;
}

export class UpdateArticleContent {
  @IsEnum(ArticleFrom)
  @IsNotEmpty()
  model: ArticleFrom;

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class GenerateArticlePayloadRequest {
  @IsEnum(ArticleFrom)
  @IsOptional()
  model?: ArticleFrom;
}

export class ImplementArticleRequestDto {
  @IsNotEmpty()
  @IsString()
  auditReport: string;

  @IsNotEmpty()
  @IsString()
  editorContent: string;
}
