import { IsNotEmpty, IsString } from 'class-validator';

export class RegenerateArticleDto {
  @IsString()
  @IsNotEmpty()
  article: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}