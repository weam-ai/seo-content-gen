import { ArrayMinSize, IsNotEmpty, IsMongoId } from 'class-validator';

export class ArticleTaskPriorityDto {
  @IsMongoId({ each: true })
  @IsNotEmpty()
  @ArrayMinSize(1, { message: 'At least one articleId is required.' })
  articleIds: string[];
}
