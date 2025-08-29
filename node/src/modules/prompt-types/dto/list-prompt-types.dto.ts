import { IntersectionType } from '@nestjs/mapped-types';
import { QueryPaginationDto } from '@shared/types/request.t';
import { IsOptional, IsString } from 'class-validator';

export class ListPromptTypeQuery {
  @IsOptional()
  @IsString()
  search?: string;
}

export class ListPromptTypeQueryPagination extends IntersectionType(
  QueryPaginationDto,
  ListPromptTypeQuery,
) {}
