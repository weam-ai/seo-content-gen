import {
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sort: string;

  @IsOptional()
  @IsString()
  search?: string;
}
