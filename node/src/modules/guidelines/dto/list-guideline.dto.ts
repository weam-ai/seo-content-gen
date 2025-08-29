import { IntersectionType } from '@nestjs/mapped-types';
import { QueryPaginationDto } from '@shared/types/request.t';
import { IsOptional, IsString } from 'class-validator';

export class ListGuidelineDtoQuery {
  @IsOptional()
  @IsString()
  search?: string;
}

export class ListGuidelineQueryPagination extends IntersectionType(
  QueryPaginationDto,
  ListGuidelineDtoQuery,
) {}