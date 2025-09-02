import { QueryPaginationDto } from '@shared/types/request.t';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListArticleDtoQuery extends QueryPaginationDto {
  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  project_ids: string[];

  @IsOptional()
  @IsString()
  status?: string;

  // Removed user_ids, assigned_to_me, and my_following_tasks fields - single-user application

  @IsOptional()
  @IsString()
  search_by_project?: string;

  // Removed search_by_agency field

  @IsOptional()
  @IsString()
  search_by_status?: string;

  // Removed staffid field - single-user application

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class StatusViewListArticleDtoQuery extends ListArticleDtoQuery {
  @IsOptional()
  @IsString()
  @IsEnum(['topics', 'article'])
  module?: string;
}
