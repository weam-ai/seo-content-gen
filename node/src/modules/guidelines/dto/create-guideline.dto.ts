import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGuidelineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}