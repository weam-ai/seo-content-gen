import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  Query,
  Res,
  ParseBoolPipe,
  ValidationPipe,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@shared/pipes/parse-objectid.pipe';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

import {
  ListArticleDtoQuery,
  StatusViewListArticleDtoQuery,
} from './dto/list-article.dto';
import {
  acceptedResponse,
  successPaginationResponseWithData,
  successResponse,
  successResponseWithData,
} from '@shared/utils/reponses.utils';
import { Request, Response } from 'express';
import { ARTICLES_STRING } from '@shared/utils/string.utils';
// Removed AssignedMembersDto import
import { ARTICLE_STATUS_CONST, ArticleStatus } from '@shared/types/articles.t';
import { instanceToPlain } from 'class-transformer';
import {
  GenerateArticlePayloadRequest,
  SelectArticleContent,
  ImplementArticleRequestDto,
} from './dto/article-content.dto';
// Removed ArticleBulkAssignDto import - functionality no longer supported
import { ArticleTaskPriorityDto } from './dto/article-task-priority.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: Request & { user: any },
    @Body() createArticleDto: CreateArticleDto,
    @Res() res: Response,
  ) {
    const loggedInUserId = req.user?.id;
    const article = await this.articleService.create(
      createArticleDto,
      loggedInUserId,
    );

    // Convert Mongoose document to plain object manually
    const plainArticle = {
      _id: article._id?.toString() || article._id,
      name: article.name,
      project: article.project,
      user: article.user,
      keywords: article.keywords,
      keyword_volume: article.keyword_volume,
      keyword_difficulty: article.keyword_difficulty,
      secondary_keywords: article.secondary_keywords,
      generated_outline: article.generated_outline,
      start_date: article.start_date,
      end_date: article.end_date,
      status: article.status,
      approved_at: article.approved_at,
      settings: article.settings,
      published_url: article.published_url,
      is_content_generated: article.is_content_generated,
      is_outline_generated: article.is_outline_generated,
      priority: article.priority,
      audit_report: article.audit_report,
      audit_report_generated_at: article.audit_report_generated_at,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      created_at: article.created_at,
      updated_at: article.updated_at
    };

    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.TOPIC_ADDED,
      plainArticle,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: Partial<ListArticleDtoQuery>,
  ) {
    if (query.status && typeof query.status === 'string') {
      Object.assign(query, { status: query.status.split(',') });
    }

    //search_by_status - Override status
    if (query.search_by_status && typeof query.search_by_status === 'string') {
      Object.assign(query, { status: query.search_by_status.split(',') });
    }

    //search_by_project
    if (
      query?.search_by_project &&
      typeof query.search_by_project === 'string'
    ) {
      Object.assign(query, {
        project_ids: [
          ...query.search_by_project.split(','),
          ...(query?.project_ids ?? []),
        ],
      });
    }

    // Removed staffid filtering for single-user application

    // Removed assigned_to_me filtering for single-user application

    const { articles, pagination } = await this.articleService.findAll(
      query,
      req.user as any,
    );

    // Convert ObjectIds to strings for proper serialization
    const serializedArticles = articles.map(article => ({
      ...article,
      _id: article._id?.toString() || article._id,
      project: article.project ? {
        ...article.project,
        _id: article.project._id?.toString() || article.project._id
      } : null,
      user: article.user ? {
        ...article.user,
        _id: article.user._id?.toString() || article.user._id
      } : null
    }));


    if (query?.limit !== 0 && query?.limit !== -1) {
      return successPaginationResponseWithData(
        pagination,
        res,
        ARTICLES_STRING.SUCCESS.ARTICLES_FETCHED,
        serializedArticles,
      );
    } else {
      return successResponseWithData(
        res,
        ARTICLES_STRING.SUCCESS.ARTICLES_FETCHED,
        serializedArticles,
      );
    }
  }

  @Get('/status-view')
  @UseGuards(JwtAuthGuard)
  async getArticlesStatusView(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: Partial<StatusViewListArticleDtoQuery>,
  ) {
    if (query.status && typeof query.status === 'string') {
      Object.assign(query, { status: query.status.split(',') });
    }

    //search_by_status - Override status
    if (query.search_by_status && typeof query.search_by_status === 'string') {
      Object.assign(query, { status: query.search_by_status.split(',') });
    }

    //search_by_project
    if (
      query?.search_by_project &&
      typeof query.search_by_project === 'string'
    ) {
      Object.assign(query, {
        project_ids: [
          ...query.search_by_project.split(','),
          ...(query?.project_ids ?? []),
        ],
      });
    }

    // Removed staffid filtering for single-user application

    // Removed assigned_to_me filtering for single-user application

    // Use all available statuses regardless of module
    let statuses = [...ARTICLE_STATUS_CONST];

    // If status filter is provided, only fetch articles for those specific statuses
    if (
      query.status &&
      Array.isArray(query.status) &&
      query.status.length > 0
    ) {
      statuses = statuses.filter((status) =>
        query.status!.includes(status.value),
      );
    }

    const articles = await Promise.all(
      statuses.map((status) =>
        this.articleService.findAll(
          { ...query, status: status.value },
          req.user as any,
        ),
      ),
    );

    const result = {};
    statuses.map((status, i) => (result[status.value] = articles[i].articles));

    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLES_FETCHED,
      result,
    );
  }

  @Get('/task-status-count')
  @UseGuards(JwtAuthGuard)
  async getTaskStatusCount(
    @Res() res: Response,
    @Req() req: Request,
    @Query('task_type') taskType?: string,
  ) {
    const parsedTaskType = taskType && taskType !== '0' ? taskType : null;
    const taskCounts = await this.articleService.getTaskStatusCounts(
      parsedTaskType,
      req.user as any,
    );

    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.TASK_STATUS_RETRIVED,
      taskCounts,
    );
  }

  @Get('/task-status')
  async getTaskStatus(@Res() res: Response) {
    const taskStatuses = await this.articleService.getTaskStatuses();
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.TASK_STATUS_RETRIVED,
      taskStatuses,
    );
  }

  // Removed assign-members and assign-followers endpoints

  @Get('/topic-status')
  getArticlesStatus(@Res() res: Response, @Query('module') module: string) {
    let status;
    if (module === 'topic') {
      status = ARTICLE_STATUS_CONST.filter((e) =>
        [ArticleStatus.PENDING, ArticleStatus.REJECTED].includes(e.value),
      );
    }
    if (module === 'article') {
      status = ARTICLE_STATUS_CONST.filter(
        (e) =>
          ![ArticleStatus.PENDING, ArticleStatus.REJECTED].includes(e.value),
      );
    }
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_STATUS_FETCHED,
      status ?? ARTICLE_STATUS_CONST,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string, @Res() res: Response) {
    const article = await this.articleService.findOne(id);
    
    // Convert ObjectIds to strings for proper serialization
    const serializedArticle = {
      ...article,
      _id: article._id?.toString() || article._id,
      project: article.project ? {
        ...article.project,
        _id: article.project._id?.toString() || article.project._id
      } : null,
      user: article.user ? {
        ...article.user,
        _id: article.user._id?.toString() || article.user._id
      } : null
    };
    
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_FETCHED,
      serializedArticle,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: Request,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Res() res: Response,
  ) {
    const updatedArticle = await this.articleService.update(
      id,
      updateArticleDto,
      req.user as any,
    );
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_UPDATED,
      updatedArticle,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    await this.articleService.remove(id, req.user);
    return successResponse(res, ARTICLES_STRING.SUCCESS.ARTICLE_DELETED);
  }

  @Get(':articleId/ai-content')
  async getArticleAIContent(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Res() res: Response,
  ) {
    const content = await this.articleService.fetchArticleContent(articleId);
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLES_CONTENT_FETCHED,
      content,
    );
  }

  @Post(':articleId/ai-content')
  async RequestGenerateAIContent(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: GenerateArticlePayloadRequest,
    @Res() res: Response,
  ) {
    await this.articleService.requestPythonAIContentGenerate(articleId, body);
    return acceptedResponse(res, ARTICLES_STRING.SUCCESS.ARTICLE_AI_REQUESTED);
  }

  /**
   * @description This API is used to select AI content between models and save to attached Google doc
   * @param articleId
   * @param data
   * @param res
   * @returns
   */
  @Post(':articleId/select-ai-content')
  @UseGuards(JwtAuthGuard)
  async ChooseAiArticleContent(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() data: SelectArticleContent,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.articleService.chooseAIArticleContent(
      articleId,
      data,
      req.user! as any,
    );
    return successResponse(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_CONTENT_SELECTION_SUCCESS,
    );
  }

  @Get('project/:projectId/keywords')
  async getKeywords(
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Res() res: Response,
  ) {
    const keywords = await this.articleService.getProjectKeywords(projectId);
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.PROJECT_KEYWORD_FETCHED,
      keywords,
    );
  }

  /**
   * @description This API is used to get or generate outline from article
   * @param articleId
   * @param refresh
   * @param res
   * @returns
   */
  @Get(':articleId/outline')
  async articleOutline(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Query('refresh', new ParseBoolPipe({ optional: true })) refresh: boolean,
    @Res() res: Response,
  ) {
    const outline = await this.articleService.getAndGenerateArticleOutline(
      articleId,
      refresh,
    );
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.ARTICLE_OUTLINE_GENERATED,
      outline,
    );
  }

  /**
   * @description This API is used to /re-generate/ topics for article
   * @param articleId
   * @param res
   * @returns
   */
  @Get(':articleId/topics')
  async generateTitles(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Query('is_save', new ParseBoolPipe({ optional: true })) is_save: boolean,
    @Res() res: Response,
  ) {
    const topic = await this.articleService.regenerateTitle(articleId, is_save);
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.TOPIC_GENERATED,
      topic,
    );
  }

  /**
   * @description This API is used to generate topics for article with AI model
   * @param articleId
   * @param body
   * @param res
   * @returns
   */
  @Post(':articleId/topics')
  @UseGuards(JwtAuthGuard)
  async generateTopicsWithAI(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: GenerateArticlePayloadRequest,
    @Res() res: Response,
  ) {
    const { model, requestId } = body;
    
    if (!model || !requestId) {
      throw new BadRequestException('Both model and requestId are required');
    }
    
    const topics = await this.articleService.generateTopicsWithAI(articleId, model, requestId);
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.TOPIC_ADDED,
      topics,
    );
  }

  @Post(':projectId/check-title')
  async checkExistingTitles(
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Body('title', new ValidationPipe({ transform: true, whitelist: true }))
    title: string,
    @Res() res: Response,
  ) {
    const existingTopic = await this.articleService.checkExistinProjectTitles(
      projectId,
      title,
    );
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.TOPIC_GENERATED,
      {
        existingTopic,
      },
    );
  }

  // Removed bulk-assign endpoint - functionality no longer supported

  @Post('/task-priority')
  async taskPriorityUpdate(
    @Body() taskPriorityDto: ArticleTaskPriorityDto,
    @Res() res: Response,
  ) {
    await this.articleService.articleTaskPriority(taskPriorityDto);
    return successResponse(res, ARTICLES_STRING.SUCCESS.TASK_PRIORITY_UPDATED);
  }

  // Removed audit report endpoint - functionality no longer supported for single-user application

  @Post(':articleId/implement')
  @UseGuards(JwtAuthGuard)
  async implementArticle(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: ImplementArticleRequestDto,
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const generated = await this.articleService.implementArticleWithGemini(
      articleId,
      body.auditReport,
      body.editorContent,
      req.user,
    );
    return successResponseWithData(
      res,
      'Article implemented and generated successfully',
      generated,
    );
  }

  @Get(':articleId/recommended-keywords')
  async getRecommendedKeywords(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Res() res: Response,
    @Query('minVolume') minVolume?: string,
    @Query('maxDifficulty') maxDifficulty?: string,
  ) {
    const minVol = minVolume ? parseInt(minVolume, 10) : undefined;
    const keywords = await this.articleService.getRecommendedKeywordsForArticle(
      articleId,
      minVol,
      maxDifficulty,
    );
    return successResponseWithData(
      res,
      ARTICLES_STRING.SUCCESS.RECOMMENDED_KEYWORD_FETCHED,
      keywords,
    );
  }
}
