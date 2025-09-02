import { CreateSystemPromptDto } from './create-system-prompt.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateSystemPromptDto extends PartialType(CreateSystemPromptDto) {}
