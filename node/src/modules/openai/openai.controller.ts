import { Controller, Res, Body, Post, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { successResponseWithData } from '@shared/utils/reponses.utils';
import { instanceToPlain } from 'class-transformer';
import { OPENAI_STRING } from '@shared/utils/string.utils';
import { RegenerateArticleDto } from './dto/regenerate-article.dto';
import { OpenAIService } from './openai.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
// Removed chat functionality - chat-completion.dto deleted

@UseGuards(JwtAuthGuard)
@Controller('openai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAIService) {}

  @Post('regenerate-article-part')
  async regenerateArticlePortion(
    @Body() data: RegenerateArticleDto,
    @Res() res: Response,
  ) {
    const result = await this.openAiService.regenerateArticlePortion(data);
    return successResponseWithData(
      res,
      OPENAI_STRING.SUCCESS.ARTICLE_SNIPPET_UPDATED,
      result,
    );
  }

  // Removed chat endpoints - chat functionality deleted
  // @Post('chat')
  // @Post('generate-content')
}