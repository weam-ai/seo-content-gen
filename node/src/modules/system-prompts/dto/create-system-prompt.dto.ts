import { SYSTEM_PROMPT_TYPES } from '@shared/types/system-prompt.t';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSystemPromptDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SYSTEM_PROMPT_TYPES)
  @IsNotEmpty()
  type: SYSTEM_PROMPT_TYPES;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  is_default: boolean;
}
