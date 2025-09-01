import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@shared/pipes/parse-objectid.pipe';
import { ArticleDocumentsService } from './article-documents.service';
import {
  ArticleDocumentRestoreContent,
  ArticleDocumentUpdateContent,
} from './dto/article-document.dto';
import {
  acceptedResponse,
  successResponseWithData,
} from '@/shared/utils/reponses.utils';
import { ARTICLES_STRING } from '@/shared/utils/string.utils';
import { Request, Response } from 'express';
// import { OpenAIService } from '@/modules/openai/openai.service';
import { ArticleDocumentQualityCheckDto } from './dto/article-document-quality-check.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@Controller('article-documents')
@UseGuards(JwtAuthGuard)
export class ArticleDocumentsController {
  constructor(
    private readonly articleDocumentService: ArticleDocumentsService,
    // private readonly openAIService: OpenAIService,
  ) {}

  @Get('/:articleId/versions')
  async getDocumentVersions(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Res() res: Response,
  ) {
    const result =
      await this.articleDocumentService.getDocumentVersions(articleId);
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_DOCUMENT_VERSIONS_GET,
      result,
    );
  }

  @Get('/:articleId/content')
  async getArticleDocument(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Res() res: Response,
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    const document = await this.articleDocumentService.getDocument(
      articleId,
      version,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_DOCUMENT_GET,
      document,
    );
  }

  @Post('/:articleId/update')
  async documentUpdates(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: ArticleDocumentUpdateContent,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.articleDocumentService.updateDocument(
      articleId,
      body,
      req.user! as any,
    );
    return acceptedResponse(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_DOCUMENT_UPDATED,
    );
  }

  @Post('/:articleId/versions/:version/restore')
  async restoreToVersion(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() body: ArticleDocumentRestoreContent,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.articleDocumentService.restoreToVersion(
      articleId,
      version,
      body,
      req.user! as any,
    );
    return acceptedResponse(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_DOCUMENT_UPDATED,
    );
  }

  @Post('/:articleId/check')
  async checkQuality(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: ArticleDocumentQualityCheckDto,
    @Res() res: Response,
  ) {
    // Temporary: OpenAI service removed
    // const result = await this.openAIService.checkArticleQuality({
    //   articleId,
    //   check_type: body.check_type,
    //   text: body.text,
    //   version: body.version,
    // });
    const result = { status: 'service_unavailable', message: 'Quality check service temporarily disabled' };

    return successResponseWithData(res, 'Quality check completed', result);
  }
}
