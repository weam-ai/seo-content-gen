import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';


// Minimal User interface for type safety
interface User {
  _id?: string;
  name?: string;
  email?: string;
}
import { Project } from '@modules/projects/entities/projects.entity';
import { ListArticleDtoQuery } from './dto/list-article.dto';
import { Pagination } from '@shared/types/response.t';
// Removed AssignedMembersDto import
import { DataForSeoService } from '@shared/services/dataforseo.service';
import {
  ArticleFrom,
  ArticleStatus,
  KeywordDifficulty,
  TargetedKeyword,
} from '@shared/types/articles.t';
import { PythonService } from '@shared/services/python.service';
import {
  ARTICLES_STRING,
  COMMON_ERROR_STRING,
  // EMAIL_STRING, // Removed - email functionality not supported
} from '@shared/utils/string.utils';
import { ArticleContent } from './entities/article-content.entity';
import {
  GenerateArticlePayloadRequest,
  SelectArticleContent,
} from './dto/article-content.dto';
// Roles functionality removed
// Email service removed for single-user application
import { ArticleDocumentsService } from '../article-documents/article-documents.service';
import { PromptType } from '../prompt-types/entities/prompt-type.entity';
// Removed ArticleBulkAssignDto import - functionality no longer supported
import { ArticleTaskPriorityDto } from './dto/article-task-priority.dto';
import { marked } from 'marked';
import { logger } from '@/shared/utils/logger.utils';
import { formatedTitles } from '@/shared/utils/article.util';
import { markdownToBlocks } from '@/shared/utils/blocknote.util';

import { RecommendedKeyword } from '../projects/entities/recommended-keyword.entity';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { iEventType } from '@shared/types/events.t';
import { DocumentUpdates } from '../article-documents/entities/document-update.entity';
import { GeminiService } from '../gemini/gemini.service';
import { ClaudeService } from '../claude/claude.service';
import { OpenAIService } from '../openai/openai.service';
import { Logger } from '@nestjs/common';
// TODO: Re-implement when modules are available
// import { PromptTypesService } from '../prompt-types/prompt-types.service';
// import { TimeTrackingService } from '../time-tracking/time-tracking.service';
import { getUserId, toObjectId, PopulatedUser } from '@/shared/types/populated-entities';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    // @InjectModel(User.name)
    // private readonly userModel: Model<User>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(ArticleContent.name)
    private readonly articleContentModel: Model<ArticleContent>,
    @InjectModel(PromptType.name)
    private readonly promptTypeModel: Model<PromptType>,

    @InjectModel(DocumentUpdates.name)
    private readonly documentUpdatesModel: Model<DocumentUpdates>,
    // private readonly dataForSeoService: DataForSeoService, // Temporarily disabled
    private readonly pythonService: PythonService,
    // private readonly emailService: EmailService, // Temporarily disabled
    // private readonly articleDocumentService: ArticleDocumentsService, // Temporarily disabled
    private readonly geminiService: GeminiService,
    private readonly eventEmitter: EventEmitter2,
    private readonly claudeService: ClaudeService,
    private readonly openaiService: OpenAIService,
    // TODO: Re-implement when services are available
    // private readonly promptTypesService: PromptTypesService,
    // private readonly timeTrackingService: TimeTrackingService,
  ) {}

  async create(createArticleDto: CreateArticleDto, user?: any) {
    try {
      const project = await this.projectModel.findOne({
        _id: createArticleDto.project_id
      });

      if (!project) {
        throw new BadRequestException(
          `Project with ID ${createArticleDto.project_id} does not exist`,
        );
      }
      
      const articleData = {
        ...createArticleDto,
        project: toObjectId(createArticleDto.project_id),
        user: user ? toObjectId(user._id) : undefined,
        status: ArticleStatus.NOT_STARTED,
        approved_at: new Date(),
      };
      
      const article = new this.articleModel(articleData);
      const newArticle = await article.save();

      return newArticle;
    } catch (error) {
      console.error('Error in create method:', error);
      throw error;
    }
  }

  async findAll(query?: Partial<ListArticleDtoQuery>, user?: any) {
    const {
      page: pageParam = 1,
      limit: limitParam = 10,
      search,
      sort,
      project_ids,
      // Removed user_ids parameter for single-user application
      status,
    } = query || {};

    // Parse page and limit as integers
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : pageParam;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : limitParam;

    // Handle limit 0 or -1 case explicitly - completely avoid pagination when limit is 0 or -1
    const shouldApplyPagination = limit !== 0 && limit !== -1;

    // Build match conditions
    const matchConditions: any = {
      deleted_at: null,
      name: { $ne: null }
    };

    // Filter articles by authenticated user
    if (user && user._id) {
      matchConditions.user = toObjectId(user._id);
    }

    // Build search conditions separately
    const searchConditions: any[] = [];
    if (search) {
      searchConditions.push(
        { name: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
        { secondary_keywords: { $elemMatch: { $regex: search, $options: 'i' } } },
        { keyword_difficulty: { $regex: search, $options: 'i' } }
      );
    }

    if (status) {
      const statusArray = Array.isArray(status) ? status : status.split(',');
      if (statusArray.length > 0) {
        matchConditions.status = { $in: statusArray };
      }
    }

    if (project_ids && project_ids.length > 0) {
      const projectIdsArray = Array.isArray(project_ids) ? project_ids : [project_ids];
      matchConditions.project = { $in: projectIdsArray.map(id => toObjectId(id)) };
    }

    // Build date conditions separately
    const dateConditions: any[] = [];
    if (query?.start_date && query?.end_date) {
      dateConditions.push(
        {
          start_date: { $gte: new Date(query.start_date), $lte: new Date(query.end_date) }
        },
        {
          end_date: { $gte: new Date(query.start_date), $lte: new Date(query.end_date) }
        },
        {
          $and: [
            { start_date: { $lte: new Date(query.start_date) } },
            {
              $or: [
                { end_date: { $gte: new Date(query.end_date) } },
                { end_date: null }
              ]
            }
          ]
        }
      );
    } else {
      if (query?.start_date) {
        matchConditions.start_date = new Date(query.start_date);
      }
      if (query?.end_date) {
        matchConditions.end_date = new Date(query.end_date);
      }
    }

    // Combine all OR conditions properly
    const orConditions: any[] = [];
    if (searchConditions.length > 0) {
      orConditions.push(...searchConditions);
    }
    if (dateConditions.length > 0) {
      orConditions.push(...dateConditions);
    }
    
    if (orConditions.length > 0) {
      matchConditions.$or = orConditions;
    }

    // Agency search functionality removed - no longer supported
    // if (query?.search_by_agency) {
    //   // Agency-based filtering functionality removed
    // }

    // Removed user-based filtering for single-user application

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'solution_seo_projects',
          localField: 'project',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $lookup: {
          from: 'user',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      // Removed assigned_members lookup - functionality no longer supported
      // {
      //   $lookup: {
      //     from: 'users',
      //     localField: 'assigned_members',
      //     foreignField: '_id',
      //     as: 'assigned_members'
      //   }
      // },
      // Prompt types are no longer supported
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      // Prompt type unwind removed
      // Add projection to ensure all necessary fields are included
      {
        $project: {
          _id: 1,
          name: 1,
          keywords: 1,
          keyword_volume: 1,
          keyword_difficulty: 1,
          status: 1,
          start_date: 1,
          end_date: 1,
          secondary_keywords: 1,
          generated_outline: 1,
          meta_title: 1,
          meta_description: 1,
          settings: 1,
          project: 1,
          // user: 1, // Removed user reference
          article_content: 1,
          priority: 1,
          approved_at: 1,
          created_at: 1,
          updated_at: 1,
          published_url: 1,
          is_content_generated: 1,
          is_outline_generated: 1
        }
      }
    ];

    if (sort) {
      const [field, direction] = sort.split(':');
      const validFields = [
        '_id',
        'name',
        'status',
        'keywords',
        'keyword_volume',
        'keyword_difficulty',
        'priority',
        'approved_at',
        'created_at',
        'updated_at',
      ];
      const validDirections = ['asc', 'desc'];

      if (
        !validFields.includes(field) ||
        !validDirections.includes(direction)
      ) {
        throw new BadRequestException(
          "Invalid sort parameter. Format should be field:direction (e.g., 'name:asc')",
        );
      }

      const sortField = field === 'id' ? '_id' : field;
      pipeline.push({
        $sort: { [sortField]: direction === 'asc' ? 1 : -1 }
      });
    }

    // Get total count first
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.articleModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Apply pagination only if limit is not -1
    if (shouldApplyPagination) {
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });
    }

    const articles = await this.articleModel.aggregate(pipeline);
    const totalPages = shouldApplyPagination ? Math.ceil(total / limit) : 1;

    const pagination: Pagination = {
      current_page: shouldApplyPagination ? page : 1,
      total_records: total,
      total_pages: totalPages,
    };

    // Return articles with _id fields intact
    const articlesWithPrompts = articles.map((article) => {
      const transformedArticle = {
        ...article,
        project: article.project || null,
        // user: article.user || null, // Removed user reference
        article_content: article.article_content?.toString(),
        // Removed assign_member field - functionality no longer supported
        // Prompt types are no longer supported
      };
      
      return transformedArticle as any;
    });

    return {
      articles: articlesWithPrompts,
      pagination,
    };
  }

  async findOne(id: string) {
    const query: any = { _id: toObjectId(id) };
    // Articles are now project-dependent only, no user filtering needed

    const article = await this.articleModel
      .findOne(query)
      .select('name keywords keyword_volume keyword_difficulty status start_date end_date created_at updated_at secondary_keywords generated_outline meta_title meta_description settings project')
      .populate({
        path: 'project',
        select: 'name description targeted_audience'
      })
      // Removed user population with role - single user application doesn't need role-based access
      // Removed assigned_members and assign_followers population - functionality no longer supported
      // Removed prompt_type populate - article types no longer supported
      .lean();

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Return article with _id fields intact
    return {
      ...article,
      project: article.project || null,
    };
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ) {
    const article = await this.articleModel.findById(toObjectId(id))
      // Removed assigned_members and assign_followers population - functionality no longer supported
      .populate('project')
      .populate('user')
      // Prompt types are no longer supported
      .lean();

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Store original status for comparison
    const originalStatus = article.status;

    // Store original title for comparison
    const originalTitle = article.name || '';

    // Removed assigned_members and assign_followers functionality - no longer supported
    let newAssignees: User[] = [];
    let newFollowers: User[] = [];

    const payload: any = {
      ...updateArticleDto,
      // Removed assigned_members and assign_followers - functionality no longer supported
    };

    // Convert project_id to project for MongoDB reference
    if (updateArticleDto.project_id) {
      payload.project = toObjectId(updateArticleDto.project_id);
      delete payload.project_id;
    }

    // If generated_outline is being updated to null or empty, set is_outline_generated to false
    if (
      Object.prototype.hasOwnProperty.call(
        updateArticleDto,
        'generated_outline',
      ) &&
      (!updateArticleDto.generated_outline ||
        updateArticleDto.generated_outline.trim() === '')
    ) {
      payload.is_outline_generated = false;
    }

    if (updateArticleDto?.status === ArticleStatus.NOT_STARTED) {
      Object.assign(payload, { approved_at: new Date() });
    }

    await this.articleModel.updateOne(
      { _id: toObjectId(article._id) },
      { $set: payload }
    );

    // Timer activity tracking removed for single-user application

    // Get the updated article with all relations
    const updatedArticle = await this.findOne(id);

    // Determine if the status changed from topic to article or vice versa
    const wasTopicBefore = this.isTopicStatus(originalStatus);
    const isTopicNow = this.isTopicStatus(updatedArticle.status);

    // User tracking removed for single-user application
    const user = null; // Single-user mode: no user tracking needed

    if (user) {
      if (wasTopicBefore && !isTopicNow) {
        // Event emitters removed for single-user application
        // Event emitters removed for single-user application
      } else if (!wasTopicBefore && isTopicNow) {
        // Event emitters removed for single-user application
      } else if (wasTopicBefore && isTopicNow) {
        // Event emitters removed for single-user application
      } else {
        // Event emitters removed for single-user application
      }
    }

    // Send email to new assignees - disabled
    if (newAssignees.length > 0) {
      // Team assignment functionality removed

      // Send notifications to newly assigned members
      for (const member of newAssignees) {
        // Notification functionality removed
        // if (currentUser && getUserId(currentUser as any) === (member._id as any).toString()) continue; // Skip notifying the current user
      }
    }

    // Email functionality removed for single-user application

    // Email functionality removed for single-user application

    return updateArticleDto as any;
  }

  async remove(id: string) {
    // First, fetch the article with all related data before deletion
    const article = await this.articleModel.findById(toObjectId(id))
      // Removed assigned_members and assign_followers population - functionality no longer supported
      .populate('user') // creator
      .populate('project')
      .exec();

    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    const isTopicStatus = this.isTopicStatus(article.status);

    // User tracking removed for single-user application
    const user = null; // Single-user mode: no user tracking needed

    // Emit the appropriate event
    this.eventEmitter.emit(
      isTopicStatus ? iEventType.TOPIC_DELETED : iEventType.ARTICLE_DELETED,
      user,
      article,
      article.project,
    );

    const allUsersToNotify = new Set<string>();

    // Member and follower notification functionality removed - no longer supported
    // const allUsersToNotify = new Set<string>();

    // User notification functionality removed for single-user application

    // Delete the article
    await this.articleModel.deleteOne({ _id: toObjectId(id) });

    // Send notifications to all relevant users
    if (allUsersToNotify.size > 0) {
      // Fetch user details for email notifications
      // const usersToNotify = await this.userModel.find({
        //   _id: { $in: Array.from(allUsersToNotify).map(toObjectId) },
        // });
        const usersToNotify: User[] = []; // Temporary: user model removed

      // Send email notifications
      for (const user of usersToNotify) {
        // Email notification removed - not supported in single-user application

        // Notification functionality removed
        // Emit notification event for notification list entry
      }
    }

    return { message: `Article ${id} deleted successfully` };
  }

  // Keep only one implementation of this method
  private isTopicStatus(status: ArticleStatus): boolean {
    return (
      status === ArticleStatus.PENDING ||
      status === ArticleStatus.REJECTED ||
      status === ArticleStatus.NOT_STARTED
    );
  }

  async getTaskStatuses(): Promise<string[]> {
    const result = await this.articleModel.aggregate([
      {
        $match: {
          deleted_at: null,
          name: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$status'
        }
      },
      {
        $project: {
          status: '$_id',
          _id: 0
        }
      }
    ]);

    return result.map((row: { status: string }) => row.status);
  }

  async getTaskStatusCounts(
    taskType?: string | null,
  ): Promise<any> {
    const matchConditions: any = {
      deleted_at: null,
    };

    if (taskType) {
      matchConditions.task_type = taskType;
    }

    // Role-based access control removed for single-user application

    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const statusCounts = await this.articleModel.aggregate(pipeline);
    const taskSummary: Record<string, number> = {};

    statusCounts.forEach((row: { _id: string; count: number }) => {
      taskSummary[row._id] = row.count;
    });

    return taskSummary;
  }

  // Removed assignMembers and assignFollowers methods

  async createArticleFromKeywords(
    project: Project,
    keywords: TargetedKeyword[],
    secondary_keywords?: string[],
    skipTitleGeneration: boolean = false,
    authToken?: string,
  ) {
    //create article at top most priority
    const articles = await Promise.all(
      keywords.map(async (keyword) => {
        const articleData = {
          keywords: keyword.keyword,
          project: toObjectId((project as any)._id),
          secondary_keywords: secondary_keywords ?? [],
        };
        return await this.articleModel.create(articleData);
      }),
    );

    //fetch and save matrix fetch in background
    try {
      await Promise.all(
        articles.map((article) =>
          this.updateArticleKeywordsMetrics(article._id.toString()),
        ),
      );
    } catch {
      logger.log(
        'Error',
        ARTICLES_STRING.ERRORS.ERROR_FETCHING_KEYWORD_METRICS,
      );
    }

    //fetch and save titles for keywords in background
    if (!skipTitleGeneration) {
      try {
        // Get a default prompt type from the database for keywords without promptTypeId
        const defaultPromptType = await this.promptTypeModel.findOne({}).exec();
        
        if (!defaultPromptType) {
          throw new NotFoundException('No prompt types found. Please create a prompt type first.');
        }

        // Ensure all keywords have a valid promptTypeId
        const keywordsWithPromptType = keywords.map(keyword => ({
          keyword: keyword.keyword,
          promptTypeId: keyword.promptTypeId || defaultPromptType._id.toString()
        }));

        const generateTitles = await this.pythonService.generateTitles({
          ProjectId: (project as any)._id.toString(),
          Keywords: keywordsWithPromptType,
        }, authToken);

        if (!generateTitles) {
          throw new InternalServerErrorException(
            ARTICLES_STRING.ERRORS.ERROR_GENERATING_TITLES,
          );
        }

        await Promise.all(
          formatedTitles(generateTitles).map(async (title, i) => {
            return this.articleModel.updateOne(
              { _id: articles[i]._id },
              { $set: { name: title } }
            );
          }),
        ).then(() => {
          //event for topic created
          articles.forEach((article) => {
            // this.eventEmitter.emit(
            //   iEventType.TOPIC_CREATED,
            //   user,
            //   article,
            //   project,
            // ); // Disabled
          });
        });

        //Send Mail to assignees to all articles - disabled
        // Team assignment functionality removed
      } catch (error) {
        logger.log(
          'error',
          'Error generating titles: [' +
            keywords.map((k) => k.keyword).join(', ') +
            '] for project: ' +
            (project as any)._id.toString() +
            ', error: ' +
            error?.message,
        );
      }
    }

    return this.getProjectKeywords((project as any)._id.toString());
  }

  async generateTitlesForProject(
    projectId: string,
    keywords: TargetedKeyword[],
    authToken?: string,
  ) {
    // Find articles that don't have titles yet for this project
    const articlesWithoutTitles = await this.articleModel
      .find({
        project: toObjectId(projectId),
        name: null, // Articles without titles
      })
      .populate('project')
      .populate('user')
      .exec();

    if (!articlesWithoutTitles.length) {
      return;
    }

    const articles: Article[] = [];
    const requestKeywords: TargetedKeyword[] = [];

    keywords.map((k) => {
      const re = articlesWithoutTitles.find((e) => e.keywords === k.keyword);
      if (!re) return;
      articles.push(re);
      requestKeywords.push(k);
    });

    try {
      const generateTitles = await this.pythonService.generateTitles({
        ProjectId: projectId,
        Keywords: requestKeywords,
      }, authToken);

      if (!generateTitles) {
        throw new InternalServerErrorException(
          ARTICLES_STRING.ERRORS.ERROR_GENERATING_TITLES,
        );
      }

      const formattedTitles = formatedTitles(generateTitles);

      await Promise.all(
        articlesWithoutTitles.map(async (article, i) => {
          if (formattedTitles[i]) {
            article.name = formattedTitles[i];
            return this.articleModel.updateOne(
              { _id: toObjectId(article._id) },
              { $set: { name: formattedTitles[i] } },
            );
          }
        }),
      ).then(() => {
        //event for topic created after titles are generated
        articlesWithoutTitles.forEach((article) => {
          this.eventEmitter.emit(
            iEventType.TOPIC_CREATED,
            (article.project as any).user || null, // Removed article.user reference
            article,
            article.project,
          );
        });
      });

      //Send Mail to assignees to all articles that now have titles - disabled
      // Team assignment functionality removed
    } catch (error) {
      logger.log(
        'error',
        'Error generating titles for project: [' +
          keywords.map((k) => k.keyword).join(', ') +
          '] for project: ' +
          projectId +
          ', error: ' +
          error?.message,
      );
    }
  }

  async getProjectKeywords(projectId: string) {
    const articles = await this.articleModel.aggregate([
      {
        $match: {
          project: toObjectId(projectId)
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'project'
        }
      },
      // Removed prompt_type lookup - article types no longer supported
      {
        $project: {
          keyword: '$keywords',
          volume: '$keyword_volume',
          difficulty: '$keyword_difficulty',
          // Removed prompt_type_id - article types no longer supported
          article_id: '$_id',
          is_title_generated: { $ne: ['$name', null] },
          title: '$name',

        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    if (!articles || articles.length === 0) {
      return [];
    }

    return articles;
  }

  async updateArticleKeywordsMetrics(articleId: string) {
    const article = await this.articleModel
      .findById(toObjectId(articleId))
      .populate('project')
      .exec();

    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    // Need to inject RecommendedKeyword model to use it properly
    // For now, using a workaround with direct model access
    const RecommendedKeywordModel = this.projectModel.db.model('RecommendedKeyword');
    const recommendedKeywordResponse = await RecommendedKeywordModel.findOne({
      project: toObjectId((article.project as any)._id),
    });

    const recommendedKeyword = recommendedKeywordResponse?.keywords.find(
      (e: any) => e.keyword === article.keywords,
    );

    let existingKeywordMetric: {
      keyword_volume: number;
      keyword_difficulty: string;
    } | null = null;

    if (recommendedKeyword) {
      existingKeywordMetric = {
        keyword_volume: recommendedKeyword.search_volume,
        keyword_difficulty:
          recommendedKeyword.competition.toUpperCase() as KeywordDifficulty,
      };
    }

    try {
      const keywordMatrix = existingKeywordMetric
        ? [existingKeywordMetric]
        : null; // await this.dataForSeoService.fetchKeywordMetrics([article.keywords]); // Disabled

      if (keywordMatrix?.length) {
        await this.articleModel.updateOne(
          { _id: toObjectId(articleId) },
          {
            $set: {
              keyword_difficulty: keywordMatrix[0]
                .keyword_difficulty as KeywordDifficulty,
              keyword_volume: keywordMatrix[0].keyword_volume,
            },
          },
        );
      }
    } catch (error) {
      logger.log('error', 'Error updating article keyword metrics:', error);
    }
  }

  /**
   * @description This method is use to request AI content generate to python, python will generate AI content from articleId and save using ours webhooks [/webhooks/article]
   */
  async requestPythonAIContentGenerate(
    articleId: string,
    body: GenerateArticlePayloadRequest,
    authToken?: string,
  ) {
    try {
      await this.pythonService.generateArticle({
        articleId,
        ...body,
      }, authToken);
      // Python service processes asynchronously and sends results via webhook
      // No need to check result as it's a fire-and-forget operation
    } catch (error) {
      throw new InternalServerErrorException(
        ARTICLES_STRING.ERRORS.FAILED_ARTICLE_GENERATION_FROM_SERVER,
      );
    }

    const article = await this.articleModel.findById(toObjectId(articleId))
      .populate('article_content')
      .exec();

    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    if (article.article_content) {
      const updatePayload = {};
      if (body.model === ArticleFrom.OPEN_AI) {
        Object.assign(updatePayload, {
          open_ai_content: null,
          selected_content:
            (article.article_content as any).selected_content === ArticleFrom.OPEN_AI
              ? null
              : (article.article_content as any).selected_content,
        });
      } else if (body.model === ArticleFrom.GEMINI) {
        Object.assign(updatePayload, {
          gemini_content: null,
          selected_content:
            (article.article_content as any).selected_content === ArticleFrom.GEMINI
              ? null
              : (article.article_content as any).selected_content,
        });
      } else if (body.model === ArticleFrom.CLAUDE) {
        Object.assign(updatePayload, {
          claude_content: null,
          selected_content:
            (article.article_content as any).selected_content === ArticleFrom.CLAUDE
              ? null
              : (article.article_content as any).selected_content,
        });
      } else {
        Object.assign(updatePayload, {
          gemini_content: null,
          open_ai_content: null,
          claude_content: null,
          selected_content: null,
        });
      }

      await this.articleContentModel.updateOne(
        { _id: toObjectId(article.article_content._id) },
        { $set: updatePayload },
      );
    }
  }

  async fetchArticleContent(articleId: string) {
    const article = await this.articleModel.findById(toObjectId(articleId))
      .exec();

    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    if (!article.article_content) {
      return {
        gemini_content: null,
        open_ai_content: null,
        claude_content: null,
        avg_word_count: null,
        selected_content: null,
      };
    }

    // Manually fetch the article content to avoid population issues
    const articleContent = await this.articleContentModel.findById(article.article_content).exec();
    
    if (!articleContent) {
      return {
        gemini_content: null,
        open_ai_content: null,
        claude_content: null,
        avg_word_count: null,
        selected_content: null,
      };
    }

    return articleContent;
  }

  /**
   * @description Used by Webhook trigger by python service
   * @param articleId
   * @param content
   * @param model
   */
  async saveAiContent(
    articleId: string,
    content: string,
    model: ArticleFrom | string,
    avg_word_count: number,
  ) {
    const payload = { avg_word_count };

    const article = await this.articleModel.findById(articleId)
      .populate('article_content')
      .lean();

    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    // Handle both enum values and string values from Python service
    const modelStr = typeof model === 'string' ? model : model;
    
    if (modelStr === ArticleFrom.OPEN_AI || modelStr === 'open_ai') {
      Object.assign(payload, { open_ai_content: content });
    } else if (modelStr === ArticleFrom.GEMINI || modelStr === 'gemini') {
      Object.assign(payload, { gemini_content: content });
    } else if (modelStr === ArticleFrom.CLAUDE || modelStr === 'claude') {
      Object.assign(payload, { claude_content: content });
    }

    //save article content if exists or create new one
    if (article.article_content) {
      await this.articleContentModel.updateOne(
        { _id: toObjectId(article.article_content._id) },
        { $set: payload }
      );
    } else {
      const newContent = await this.articleContentModel.create(payload);
      await this.articleModel.updateOne(
        { _id: toObjectId((article._id as any)) },
        { 
          $set: { 
            article_content: newContent._id, 
            is_content_generated: true 
          }
        }
      );
    }
  }

  async chooseAIArticleContent(
    id: string,
    data: SelectArticleContent,
  ) {
    const article = await this.articleModel.findById(id)
      .populate([
        'project',
        'article_content',
        // Removed assigned_members and assign_followers fields - functionality no longer supported
      ])
      .lean();
      
    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    if (!article.article_content) {
      throw new NotFoundException(
        ARTICLES_STRING.ERRORS.GENERATED_ARTICLE_NOT_FOUND,
      );
    }

    let content = '';
    if (data.selected_content === ArticleFrom.GEMINI) {
      content = (article.article_content as any).gemini_content ?? '';
    } else if (data.selected_content === ArticleFrom.OPEN_AI) {
      content = (article.article_content as any).open_ai_content ?? '';
    } else if (data.selected_content === ArticleFrom.CLAUDE) {
      content = (article.article_content as any).claude_content ?? '';
    }

    const blocks = markdownToBlocks(content);
    // await this.articleDocumentService.updateDocument(
    //   article._id.toString(),
    //   { snapshot: Buffer.from(JSON.stringify(blocks)) },
    //   user,
    // ); // Disabled



    await this.articleContentModel.updateOne(
      { _id: toObjectId((article.article_content as any)._id) },
      { $set: { selected_content: data.selected_content } },
    );
  }

  // Email and notification methods removed for single-user application

  // Email and notification methods removed for single-user application

  async getAndGenerateArticleOutline(articleId: string, refresh?: boolean, authToken?: string) {
    const article = await this.articleModel.findById(toObjectId(articleId)).exec();
    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    if (article.generated_outline && !refresh) {
      return article.generated_outline;
    }

    const result = await this.pythonService.generateOutline({
      articleId: article._id.toString(),
    }, authToken);

    if (!result) {
      throw new InternalServerErrorException(
        COMMON_ERROR_STRING.SOMETHING_WENT_WRONG,
      );
    }

    await this.articleModel.updateOne(
      { _id: toObjectId(article._id) },
      { $set: { generated_outline: result, is_outline_generated: true } },
    );
    return result;
  }

  async regenerateTitle(articleId: string, is_save?: boolean, authToken?: string) {
    const article = await this.articleModel.findById(toObjectId(articleId))
      .populate('project')
      .exec();
      
    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    // Get a default prompt type from the database for single-user mode
    const defaultPromptType = await this.promptTypeModel.findOne({}).exec();
    
    if (!defaultPromptType) {
      throw new NotFoundException('No prompt types found. Please create a prompt type first.');
    }

    const topics = await this.pythonService.generateTitles({
        ProjectId: (article.project as any)._id.toString(),
        Keywords: [
          { promptTypeId: defaultPromptType._id.toString(), keyword: article.keywords },
        ],
      }, authToken);

    if (!topics || !topics.length) {
      throw new InternalServerErrorException(
        COMMON_ERROR_STRING.SOMETHING_WENT_WRONG,
      );
    }

    if (is_save) {
      await this.articleModel.updateOne(
        { _id: toObjectId(articleId) },
        { $set: { name: topics[0] } }
      );
    }

    return topics[0];
  }

  private readonly logger = new Logger(ArticleService.name);

  async generateTopicsWithAI(articleId: string, model: ArticleFrom, requestId: string) {
    const article = await this.articleModel.findById(toObjectId(articleId))
      .populate('project')
      .exec();
      
    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }

    let topics: string[];
    const prompt = `Generate 5-10 relevant topic suggestions for an article with the following keywords: ${article.keywords}. Return only the topic titles, one per line.`;

    try {
      let response: string;
      
      switch (model) {
        case ArticleFrom.OPEN_AI:
          // Use OpenAI service - create a simple content generation method
          response = await this.generateContentWithOpenAI(prompt);
          break;

        case ArticleFrom.GEMINI:
          // Use Gemini service - create a simple content generation method
          response = await this.generateContentWithGemini(prompt);
          break;

        case ArticleFrom.CLAUDE:
          // Use Claude service for topic generation
          response = await this.claudeService.generateContent(prompt);
          break;

        default:
          throw new BadRequestException('Unsupported AI model specified');
      }

      topics = response.split('\n').filter(topic => topic.trim().length > 0);

      if (!topics || topics.length === 0) {
        throw new InternalServerErrorException('Failed to generate topics');
      }

      // Log the request for tracking
      this.logger.log(`Generated ${topics.length} topics for article ${articleId} using ${model} (Request ID: ${requestId})`);

      return {
        topics,
        model,
        requestId,
        articleId,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to generate topics for article ${articleId} using ${model}:`, error);
      throw new InternalServerErrorException(`Failed to generate topics using ${model}`);
    }
  }

  private async generateContentWithOpenAI(prompt: string): Promise<string> {
    // Use the existing regenerateArticlePortion method as a base
    const result = await this.openaiService.regenerateArticlePortion({
      article: '',
      text: prompt,
      prompt: 'Generate topic suggestions based on the provided keywords'
    });
    return result.modifiedPortion;
  }

  private async generateContentWithGemini(prompt: string): Promise<string> {
    // For now, return a placeholder since Gemini service doesn't have a simple generateContent method
    // This would need to be implemented based on the actual Gemini service capabilities
    throw new InternalServerErrorException('Gemini topic generation not yet implemented');
  }

  checkExistinProjectTitles(projectId: string, title: string, authToken?: string) {
    return this.pythonService.checkExistingProjectTitle(projectId, title, authToken);
  }

  // Removed articleBulkAssign method - functionality no longer supported

  async articleTaskPriority(data: ArticleTaskPriorityDto) {
    const { articleIds } = data;

    const articles = await this.articleModel.find({
      _id: { $in: articleIds.map(id => toObjectId(id)) },
    });

    if (articles.length !== articleIds.length) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.INVALID_ARTICLES_IDS);
    }

    // Update priorities using bulk operations
    const bulkOps = articleIds.map((articleId, index) => ({
      updateOne: {
        filter: { _id: toObjectId(articleId) },
        update: { $set: { priority: index + 1 } },
      },
    }));

    await this.articleModel.bulkWrite(bulkOps);
  }

  // Removed addNewAssigneesToProject method - assignment functionality no longer needed

  // Removed articleAuditReport method - audit functionality no longer supported for single-user application

  // User access checking removed for single-user application

  async implementArticleWithGemini(
    articleId: string,
    auditReport: string,
    editorContent: string,
  ): Promise<string> {
    const article = await this.articleModel.findById(toObjectId(articleId))
      .populate('article_content')
      .exec();
    if (!article) {
      throw new NotFoundException(ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND);
    }
    // Optionally: check user permissions here
    // const generated: string =
    //   await this.geminiService.implementWithAuditAndContent(
    //     auditReport,
    //     editorContent,
    //   );
    const generated: string = 'Gemini service temporarily unavailable'; // Temporary: gemini service removed
    // Save as latest Gemini content
    if (article.article_content) {
      await this.articleContentModel.updateOne(
        { _id: toObjectId(article.article_content._id) },
        { gemini_content: generated },
      );
    } else {
      const content = await this.articleContentModel.create({
        gemini_content: generated,
      });
      await this.articleModel.updateOne(
        { _id: toObjectId((article._id as any)) },
        { article_content: content._id, is_content_generated: true },
      );
    }
    return generated;
  }

  /**
   * Returns up to 10 recommended keywords for the given article, filtered by similarity, volume, difficulty, and not in secondary keywords.
   * @param articleId string
   * @param minVolume number | undefined
   * @param maxDifficulty string | undefined ('LOW' | 'MEDIUM' | 'HIGH')
   */
  async getRecommendedKeywordsForArticle(
    articleId: string,
    minVolume?: number,
    maxDifficulty?: string,
  ) {
    // Fetch the article with project and secondary_keywords
    const article = await this.articleModel.findById(toObjectId(articleId))
      .populate('project')
      .exec();
    if (!article) throw new NotFoundException('Article not found');
    if (!article.project)
      throw new NotFoundException('Project not found for article');

    // Fetch recommended keywords for the project
    const RecommendedKeywordModel = this.projectModel.db.model('RecommendedKeyword');
    const recommended = await RecommendedKeywordModel.findOne({
      project: toObjectId((article.project as any)._id),
    }).exec();
    if (!recommended || !recommended.keywords) return [];

    // Exclude keywords already in secondary_keywords
    const excludeSet = new Set(
      (article.secondary_keywords || []).map((k) => k.toLowerCase()),
    );

    // Filter and map
    const filtered = recommended.keywords.filter((kw) => {
      const normalizedKeyword = kw.keyword.toLowerCase().replace(/\s+/g, '');
      if (
        Array.from(excludeSet).some(
          (excluded) => excluded.replace(/\s+/g, '') === normalizedKeyword,
        )
      ) {
        return false;
      }
      if (minVolume && kw.search_volume < minVolume) return false;
      if (
        maxDifficulty &&
        kw.competition &&
        kw.competition.toUpperCase() > maxDifficulty.toUpperCase()
      )
        return false;
      return true;
    });

    // Compute similarity to article's main keyword
    const mainKeyword = (article.keywords || '').toLowerCase();
    const mainWords = mainKeyword.split(/\s+/).filter(Boolean);

    const matchingKeywords = filtered.filter((kw) => {
      const kwLower = kw.keyword.toLowerCase();
      return mainWords.some((word) => kwLower.includes(word));
    });

    // Sort by search volume descending
    matchingKeywords.sort(
      (a, b) => (b.search_volume || 0) - (a.search_volume || 0),
    );

    return matchingKeywords.slice(0, 10);
  }
}
