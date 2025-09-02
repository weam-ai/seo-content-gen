import { PartialType } from '@nestjs/mapped-types';
import { CreatePromptTypeDto } from './create-prompt-type.dto';

export class UpdatePromptTypeDto extends PartialType(CreatePromptTypeDto) {}
