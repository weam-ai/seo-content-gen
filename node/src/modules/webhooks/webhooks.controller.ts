import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@shared/pipes/parse-objectid.pipe';
import { GenerateArticleWebhookRequest } from './dto/article-webhook.dto';
import { Response } from 'express';
import { acceptedResponse } from '@shared/utils/reponses.utils';
import { ArticleService } from '../article/article.service';
import { WEBHOOK_STRING } from '@shared/utils/string.utils';
import { SseService } from '../sse/sse.service';
import { StaticTokenGuard } from '@shared/guards/static-token.guard';
import { ArticleFrom } from '@shared/types/articles.t';

@Controller('webhooks')
@UseGuards(StaticTokenGuard)
export class WebhooksController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly sseService: SseService,
  ) {}

  @Post('/:articleId/content')
  async aiArticleContent(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: GenerateArticleWebhookRequest,
    @Res() res: Response,
  ) {
    await this.articleService.saveAiContent(
      articleId,
      body.content,
      body.model,
      body.avg_word_count,
    );
    this.sseService.notifyClient(articleId, {
      articleId,
      model: body.model,
    });

    return acceptedResponse(res, WEBHOOK_STRING.ARTICLE_UPDATE_REQUESTED);
  }
}