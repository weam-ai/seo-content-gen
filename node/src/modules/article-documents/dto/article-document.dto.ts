import { IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocChange } from '../entities/document-update.entity';

export class ArticleDocumentUpdateContent {
  @IsNotEmpty()
  @IsString()
  session_id?: string;

  @IsNotEmpty()
  snapshot: Buffer;

  @IsOptional()
  @IsJSON()
  changes?: DocChange;
}

export class ArticleDocumentRestoreContent {
  @IsNotEmpty()
  @IsString()
  session_id?: string;
}
