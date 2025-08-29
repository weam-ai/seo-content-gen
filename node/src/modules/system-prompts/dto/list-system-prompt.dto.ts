import { IntersectionType } from '@nestjs/mapped-types';
import { QueryPaginationDto } from '@shared/types/request.t';
import { IsOptional, IsString } from 'class-validator';

export class ListSystemPromptQuery {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ListSystemPromptQueryPagination extends IntersectionType(
  QueryPaginationDto,
  ListSystemPromptQuery,
) {}
