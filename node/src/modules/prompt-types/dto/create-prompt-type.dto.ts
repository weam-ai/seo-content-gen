import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreatePromptTypeDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsMongoId()
  titlePrompt: string;

  @IsNotEmpty()
  @IsMongoId()
  outlinePrompt: string;

  @IsNotEmpty()
  @IsMongoId()
  articlePrompt: string;
}
