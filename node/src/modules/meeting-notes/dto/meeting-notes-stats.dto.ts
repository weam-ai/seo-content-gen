import { IsOptional, IsString, IsDateString } from 'class-validator';
import { QueryPaginationDto } from '@/shared/types/request.t';

export class MeetingNotesStatsDto extends QueryPaginationDto {
  @IsOptional()
  @IsDateString()
  meeting_date?: string;

  @IsOptional()
  @IsString()
  search_by_agency?: string;

  @IsOptional()
  @IsString()
  staff_id?: string;

  @IsOptional()
  @IsString()
  agency_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  project_id?: string;
}
