import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateMeetingNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  agenda: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  meeting_date: string;

  @IsUUID()
  @IsNotEmpty()
  agency_id: string;

  @IsOptional()
  @IsUUID()
  project_id?: string;
}
