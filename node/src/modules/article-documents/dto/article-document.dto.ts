import { IsNotEmpty, IsString } from 'class-validator';

export class ArticleDocumentUpdateContent {
  @IsNotEmpty()
  @IsString()
  session_id?: string;

  @IsNotEmpty()
  snapshot: Buffer;
}

export class ArticleDocumentRestoreContent {
  @IsNotEmpty()
  @IsString()
  session_id?: string;
}
