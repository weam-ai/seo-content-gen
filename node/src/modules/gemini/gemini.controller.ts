import { Controller, UseGuards, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { successResponseWithData } from '@/shared/utils/reponses.utils';
import { OPENAI_STRING } from '@/shared/utils/string.utils';
// Removed chat functionality - chat-completion.dto import deleted
// import { ChatCompletionRequestMessage } from '../openai/dto/chat-completion.dto';
import { RegenerateArticleDto } from '../openai/dto/regenerate-article.dto';

@UseGuards(JwtAuthGuard)
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('/regenerate-article-part')
  async regenerateArticlePart(@Body() body: RegenerateArticleDto, @Res() res: Response) {
    const result = await this.geminiService.regenerateArticlePortion({
      article: body.article,
      text: body.text,
      prompt: body.prompt,
    });

    return successResponseWithData(
      res,
      OPENAI_STRING.SUCCESS.ARTICLE_SNIPPET_UPDATED,
      result,
    );
  }

  // Removed chat functionality - chat endpoint deleted
  // @Post('/chat')
  // async chat(@Body() body: ChatCompletionRequestMessage, @Res() res: Response) {
  //   const response = await this.geminiService.chatCompletion(body.messages);

  //   return successResponseWithData(
  //     res,
  //     OPENAI_STRING.SUCCESS.CHAT_RESPONSE,
  //     { response },
  //   );
  // }

  @Post('/audit-article')
  async auditArticle(@Body() body: { content: string }, @Res() res: Response) {
    const result = await this.geminiService.articleAudit(body.content);

    return successResponseWithData(
      res,
      OPENAI_STRING.SUCCESS.CHAT_RESPONSE,
      result,
    );
  }

  @Post('/generate-content')
  async generateContent(@Body() body: { prompt: string; options?: any }, @Res() res: Response) {
    const result = await this.geminiService.generateContent(body.prompt, body.options);

    return successResponseWithData(
      res,
      OPENAI_STRING.SUCCESS.CHAT_RESPONSE,
      { content: result },
    );
  }
}