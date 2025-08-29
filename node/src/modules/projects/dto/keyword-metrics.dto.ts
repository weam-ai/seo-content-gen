import { TargetedKeyword } from '@/shared/types/articles.t';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TargetedKeywordDto } from './create-project.dto';

export class AddKeywordsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetedKeywordDto)
  keywords: TargetedKeyword[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondary_keywords?: string[];
}
