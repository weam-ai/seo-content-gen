import { QueryPaginationDto } from '@shared/types/request.t';
import { IsOptional, IsString } from 'class-validator';

export class ListProjectDtoQuery extends QueryPaginationDto {
  @IsOptional()
  @IsString()
  user_id: string;
}
