import { IsNotEmpty, IsMongoId } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';
import { PartialType } from '@nestjs/mapped-types';

// UpdateProjectDto already extends CreateProjectDto, so new fields are included automatically.
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

// Removed ProjectBulkAssignDto - functionality no longer supported
