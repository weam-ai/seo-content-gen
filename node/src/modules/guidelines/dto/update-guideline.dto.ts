import { PartialType } from '@nestjs/mapped-types';
import { CreateGuidelineDto } from './create-guideline.dto';

export class UpdateGuidelineDto extends PartialType(CreateGuidelineDto) {}