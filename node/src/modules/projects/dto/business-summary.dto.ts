import { IsNotEmpty, IsUrl } from 'class-validator';

export class GenerateBusinessSummaryRequest {
  @IsNotEmpty()
  @IsUrl()
  website_url: string;
}
