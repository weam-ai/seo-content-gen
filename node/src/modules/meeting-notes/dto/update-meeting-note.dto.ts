import { PartialType } from '@nestjs/mapped-types';
import { CreateMeetingNoteDto } from './create-meeting-note.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateMeetingNoteDto extends PartialType(CreateMeetingNoteDto) {
  @IsOptional()
  @IsUUID()
  project_id?: string;
}
