import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  MethodNotAllowedException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Project, ProjectDocument } from './entities/projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  UpdateProjectDto,
} from './dto/update-project.dto';
// Removed User import - entity deleted
// Local User type definition for compatibility
interface User {
  _id?: any;
  name?: string;
  email?: string;
}
import { ListProjectDtoQuery } from './dto/list-project.dto';
import { PROJECTS_STRING } from '@shared/utils/string.utils';
import { DataForSeoService } from '@shared/services/dataforseo.service';
import { RecommendedKeyword } from './entities/recommended-keyword.entity';
import { PythonService } from '@shared/services/python.service';
// EmailService import removed - email functionality not supported
import { logger } from '@shared/utils/logger.utils';
import { Article } from '../article/entities/article.entity';
import { ArticleService } from '../article/article.service';
import { KeywordMetric } from '@shared/types/dataForSeo.t';

import { TargetedKeyword } from '@/shared/types/articles.t';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { iEventType } from '@shared/types/events.t';
import { toObjectId } from '@shared/types/populated-entities';
// NotificationType import removed
import { marked } from 'marked';
import { SeoAuditService } from '@shared/services/seo-audit.service';
import { SiteAudit, SiteAuditStatus } from './entities/site-audit.entity';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(RecommendedKeyword.name)
    private readonly recommendedKeywordModel: Model<RecommendedKeyword>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    @InjectModel(SiteAudit.name)
    private readonly siteAuditModel: Model<SiteAudit>,
    // Removed userModel injection - User entity deleted
    private readonly articleService: ArticleService,
    private readonly dataForSeoService: DataForSeoService,
    private readonly seoAuditService: SeoAuditService,
    private readonly pythonService: PythonService,
    // private readonly mailService: EmailService, // Removed - email functionality not supported
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<ProjectDocument> {
    // Removed member assignment logic
    const projectData = {
      ...createProjectDto,
      user: user?._id ? toObjectId(user._id) : undefined,
      guideline: createProjectDto.guideline_id ? new Types.ObjectId(createProjectDto.guideline_id) : undefined,
      targeted_keywords: createProjectDto.targeted_keywords
        ? createProjectDto.targeted_keywords.map(
          (e: TargetedKeyword) => e.keyword,
        )
        : [],
      organization_archetype: createProjectDto.organization_archetype,
      brand_spokesperson: createProjectDto.brand_spokesperson,
      most_important_thing: createProjectDto.most_important_thing,
      unique_differentiator: createProjectDto.unique_differentiator,
      // author_bio: createProjectDto.author_bio, // Author bio functionality removed
    };

    //Create project
    const project = await this.projectModel.create(projectData) as ProjectDocument;

    this.eventEmitter.emit(iEventType.PROJECT_CREATED, user, project);

    // Removed member assignment email notification

    //Create articles from keywords immediately - don't wait for sitemap
    if (createProjectDto.targeted_keywords?.length) {
      void this.articleService.createArticleFromKeywords(
        project,
        createProjectDto.targeted_keywords,
        [],
        true,
        user
      );
    }

    //Fetch Sitemap overview data in background, then generate titles
    const sitemapAndTitleGeneration = async () => {
      try {
        await this.fetchSiteMap(project.id, project.website_url);
        // Generate titles after sitemap fetch completes
        if (createProjectDto.targeted_keywords?.length) {
          await this.articleService.generateTitlesForProject(
            project.id,
            createProjectDto.targeted_keywords,
          );
        }
      } catch (error) {
        logger.error('Failed to fetch sitemap data:', error);
        // Fallback: Generate titles even if sitemap fetch fails
        if (createProjectDto.targeted_keywords?.length) {
          setTimeout(() => {
            void this.articleService.generateTitlesForProject(
              project.id,
              createProjectDto.targeted_keywords!,
            );
          }, 5000); // Wait 5 seconds then generate titles anyway
        }
      }
    };

    // Start the process in background without waiting
    void sitemapAndTitleGeneration();

    return project;
  }

  async findAll(
    query: ListProjectDtoQuery,
    user: User,
  ) {
    const page = typeof query.page === 'string' ? parseInt(query.page) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit) : (query.limit || 10);
    const { search, sort } = query;
    // Build aggregation pipeline for Mongoose
    const pipeline: any[] = [];
    const matchStage: any = {};

    // Single-user application: only show projects for current user
    matchStage.user = toObjectId(user._id);
    
    // Filter out deleted projects
    matchStage.deletedAt = null;

    // Search filtering
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { website_url: searchRegex },
        { language: searchRegex },
        { targeted_audience: searchRegex },
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Removed member lookup aggregation

    // Add keywords lookup
    pipeline.push({
      $lookup: {
        from: 'solution_seo_recommended_keywords',
        localField: '_id',
        foreignField: 'project',
        as: 'keywords'
      }
    });

    // Add project fields with computed values
    pipeline.push({
      $addFields: {
        keywords_count: { $size: '$keywords' }
      }
    });

    // Add sorting
    let sortStage = {};
    if (sort) {
      const [sortField, sortOrder] = sort.split(':');
      const allowedSortFields = [
        'name',
        'created_at',
        'status',
      ];

      if (
        allowedSortFields.includes(sortField) &&
        ['asc', 'desc'].includes(sortOrder.toLowerCase())
      ) {
        sortStage[sortField] = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
      } else {
        sortStage['created_at'] = -1;
      }
    } else {
      sortStage['created_at'] = -1;
    }
    pipeline.push({ $sort: sortStage });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.projectModel.aggregate(countPipeline);
    const totalRecords = countResult[0]?.total || 0;

    // Add pagination
    if (limit !== 0 && limit !== -1) {
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });
    }

    // Add final projection to keep _id field
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        website_url: 1,
        status: 1,
        keywords: 1,
        user: { $toString: '$user' },
        created_at: 1,
        updated_at: 1,
        keywords_count: 1
      }
    });

    const projects = await this.projectModel.aggregate(pipeline);

    const paginationData = {
      total_records: totalRecords,
      current_page: page,
      total_pages:
        limit === 0 || limit === -1 ? 1 : Math.ceil(totalRecords / limit),
    };

    return { paginationData, projects };
  }

  async findOne(id: string, user?: User): Promise<ProjectDocument> {
    const pipeline: any[] = [];

    // Match the specific project with user filtering for data isolation
    const matchStage: any = { _id: toObjectId(id) };
    if (user && user._id) {
      matchStage.user = toObjectId(user._id);
    }
    // Filter out deleted projects
    matchStage.deletedAt = null;
    pipeline.push({ $match: matchStage });

    // Lookup project creator
    pipeline.push({
      $lookup: {
        from: 'user',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              id: '$_id',
              firstname: 1,
              lastname: 1,
              profile_image: 1
            }
          }
        ]
      }
    });

    // Lookup guidelines
    pipeline.push({
      $lookup: {
        from: 'solution_seo_guidelines',
        localField: 'guideline',
        foreignField: '_id',
        as: 'guidelines'
      }
    });

    // Lookup articles for keywords and progress
    pipeline.push({
      $lookup: {
        from: 'solution_seo_articles',
        localField: '_id',
        foreignField: 'project',
        as: 'articles',
        pipeline: [
          // Prompt types are no longer supported
          {
            $match: {
              $and: [
                { keywords: { $ne: null } },
                { keywords: { $exists: true } },
                { keywords: { $ne: '' } }
              ],
              deletedAt: null
            }
          },
          {
            $project: {
              article_id: '$_id',
              volume: '$keyword_volume',
              keyword: '$keywords',
              difficulty: '$keyword_difficulty',
              status: 1
            }
          }
        ]
      }
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        user: { $arrayElemAt: ['$user', 0] },
        keywords: '$articles',
        progress: {
          $cond: {
            if: { $gt: [{ $size: '$articles' }, 0] },
            then: {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$articles',
                          cond: {
                            $not: {
                              $in: ['$$this.status', ['pending', 'rejected']]
                            }
                          }
                        }
                      }
                    },
                    { $size: '$articles' }
                  ]
                },
                100
              ]
            },
            else: 0
          }
        }
      }
    });

    // Include all necessary fields with _id intact
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        website_url: 1,
        competitors_websites: 1,
        targeted_keywords: 1,
        recommended_keywords: 1,
        topic_titles: 1,
        language: 1,
        location: 1,
        targeted_audience: 1,
        sitemapdata: 1,
        detailedsitemap: 1,
        keywords: 1,
        guideline: 1,
        guideline_description: 1,
        progress: 1,
        // author_bio: 1, // Author bio functionality removed
        organization_archetype: 1,
        brand_spokesperson: 1,
        most_important_thing: 1,
        unique_differentiator: 1,
        user: 1,
        guidelines: 1,
        created_at: 1,
        updated_at: 1
      }
    });

    const result = await this.projectModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    id: string,
    updateProjectDto: Partial<UpdateProjectDto>,
    user: User,
  ): Promise<ProjectDocument> {
    const project = await this.findOne(id);
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    // Simplified access control: removed member assignment checks

    if (updateProjectDto?.guideline_id) {
      Object.assign(updateProjectDto, {
        guideline: { id: updateProjectDto?.guideline_id },
      });
    }
    //If website url got changed, then fetch sitemap overview data
    if (
      updateProjectDto?.website_url &&
      project?.website_url &&
      updateProjectDto?.website_url !== project?.website_url
    ) {
      void this.fetchSiteMap(project.id, updateProjectDto.website_url);
    }

    //check new keywords added or not (if added then add new topics)
    if (updateProjectDto?.targeted_keywords) {
      const existingKeywords = (
        await this.getKeywordsForProject(project.id)
      ).map((k) => k.keyword);

      const newUniqueKeywords = [
        ...new Set(
          updateProjectDto.targeted_keywords.filter(
            (keyword) => !existingKeywords.includes(keyword.keyword),
          ),
        ),
      ];

      if (newUniqueKeywords.length)
        void this.articleService.createArticleFromKeywords(
          project,
          updateProjectDto.targeted_keywords.filter((keyword) =>
            newUniqueKeywords.includes(keyword),
          ) as unknown as TargetedKeyword[],
          [],
        );
    }

    Object.assign(project, updateProjectDto);
    const updatedProject = await this.projectModel.findByIdAndUpdate(
      project._id,
      updateProjectDto,
      { new: true }
    );

    if (!updatedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Emit project updated event
    this.eventEmitter.emit(iEventType.PROJECT_UPDATED, user, updatedProject);

    return updatedProject;
  }

  async addNewKeywords(
    id: string,
    keywords: TargetedKeyword[],
    user: User,
    secondary_keywords?: string[],
  ) {
    const project = await this.findOne(id);
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    if (!keywords?.length) {
      throw new MethodNotAllowedException(
        PROJECTS_STRING.ERROR.NOT_KEYWORD_TO_UPDATE,
      );
    }

    const existingKeywords = (await this.getKeywordsForProject(project.id)).map(
      (k) => k.keyword,
    );

    const newUniqueKeywords = [
      ...new Set(
        keywords.filter(
          (keyword) => !existingKeywords.includes(keyword.keyword),
        ),
      ),
    ];

    if (!newUniqueKeywords.length) {
      throw new BadRequestException(PROJECTS_STRING.ERROR.NO_NEW_KEYWORD_FOUND);
    }

    return this.articleService.createArticleFromKeywords(
      project,
      keywords,
      secondary_keywords,
      false,
      user,
    );
  }

  async remove(id: string, currentUser: User) {
    // Simplified project deletion - removed member access control
    const project = await this.projectModel.findById(id) as ProjectDocument;

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    //delete all related articles
    const articles = await this.articleModel.find({ project: id });

    if (articles.length > 0) {
      await this.articleModel.updateMany(
        { project: id },
        { deletedAt: new Date() }
      );
    }

    const result = await this.projectModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!result) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    this.eventEmitter.emit(iEventType.PROJECT_DELETED, null, project);
  }

  // Removed getProjectMembers method

  /**
   * @description This function would refresh recommended keywords automatically by detecting new keywords
   * @param projectId
   * @param keywords
   * @returns
   */
  async fetchKeywordRecommendation(projectId: string, user: User) {
    const project = await this.findOne(projectId);

    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    const recommendedKeywords = await this.recommendedKeywordModel.findOne({
      project: projectId,
    });

    const projectKeywords: string[] = (
      await this.getKeywordsForProject(project.id)
    ).map((k) => k.keyword);

    //check all new keywords added which is not present in recommended keywords
    const newKeywords: string[] = projectKeywords.filter(
      (k) =>
        !recommendedKeywords?.keywords.find(
          (r) => r.keyword.toLowerCase() === k.toLowerCase(),
        ),
    );

    //if targeted_keywords is provided then return it
    if (recommendedKeywords && !newKeywords.length) {
      return recommendedKeywords.keywords.filter(
        (k) =>
          !projectKeywords.some(
            (p) => p.toLowerCase() === k.keyword.toLowerCase(),
          ),
      );
    }

    const keywordRecommendation =
      await this.dataForSeoService.fetchRecommendedKeywords(newKeywords);

    if (recommendedKeywords) {
      const existingKeywords = recommendedKeywords.keywords || [];
      const mergedKeywords = [
        ...existingKeywords,
        ...keywordRecommendation,
      ].filter(
        (keyword, index, self) =>
          index === self.findIndex((k) => k.keyword === keyword.keyword),
      );

      await this.recommendedKeywordModel.findByIdAndUpdate(
        recommendedKeywords._id,
        { keywords: mergedKeywords }
      );

      return mergedKeywords.filter(
        (k) =>
          !projectKeywords.some(
            (p) => p.toLowerCase() === k.keyword.toLowerCase(),
          ),
      );
    } else {
      await this.recommendedKeywordModel.create({
        project: project._id,
        user: user._id,
        keywords: keywordRecommendation,
      });
    }

    return keywordRecommendation.filter(
      (k) =>
        !projectKeywords.some(
          (p) => p.toLowerCase() === k.keyword.toLowerCase(),
        ),
    );
  }

  // Removed projectMemberAdd and projectMemberDelete methods

  private async fetchSiteMap(projectId: string, url?: string, cb?: () => void) {
    const project = await this.findOne(projectId);
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    const targetUrl = url ?? project.website_url;

    try {
      // Run both fetches concurrently
      const [sitemapsResponse, detailedSitemap] = await Promise.all([
        this.pythonService.fetchSiteMap(targetUrl),
        this.fetchProjectSitemap((project._id as any).toString()),
      ]);

      const sitemapsData = JSON.stringify(sitemapsResponse).replace(/'/g, "''");
      await this.projectModel.findByIdAndUpdate(projectId, { sitemapdata: sitemapsData }); // Do not remove this one

      if (cb) cb();
      return {
        overview: sitemapsResponse,
        detailed: detailedSitemap,
      };
    } catch {
      logger.error(
        `Failed to fetch sitemap data : [ProjectId: ${project._id}, WebUrl: ${targetUrl}] `,
      );
    }
  }

  async getProjectSiteMap(projectId: string, refresh: boolean = false) {
    if (refresh) {
      return this.fetchSiteMap(projectId);
    }

    const projectSitemap = await this.projectModel.findById(projectId).select('sitemapdata detailedsitemap');

    try {
      const json = atob(projectSitemap?.detailedsitemap ?? '');
      const detailed = JSON.parse(json);
      return {
        overview: JSON.parse(projectSitemap?.sitemapdata ?? ''),
        detailed,
      };
    } catch {
      return {
        overview: null,
        detailed: null,
      };
    }
  }

  // Removed projectBulkAssign method

  /**
   * @description function to fetch complete site data from project and auto update in project
   * @param projectId
   */
  async fetchProjectSitemap(projectId: string) {
    const project = await this.projectModel.findById(projectId) as ProjectDocument;
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    try {
      const sitemap = await this.pythonService.fetchDetailedSitemap(
        project.website_url,
      );

      //format structure
      const formattedData = sitemap.map((page) => ({
        url: page.url,
        pageType: page.content_type || 'Unknown',
        metaTitle: page.meta_title || 'No Title',
        metaDescription: page.meta_description || 'No Description',
      }));

      //convert to base64 data to make it short data (reduce size)
      const sitemapBase64 = Buffer.from(JSON.stringify(formattedData)).toString(
        'base64',
      );

      //update data in project data
      await this.projectModel.findByIdAndUpdate(
        projectId,
        { detailedsitemap: sitemapBase64 },
      ); //Do not make it in repo service
      return formattedData;
    } catch {
      logger.info(
        `Sitemap data was not found [projectId: ${projectId}, websiteUrl: ${project.website_url}]`,
      );

      throw new UnprocessableEntityException(
        PROJECTS_STRING.ERROR.SITEMAP_DATA_NOT_FOUND,
      );
    }
  }

  async getKeywordsForProject(projectId: string): Promise<KeywordMetric[]> {
    const result = await this.articleModel.aggregate([
      {
        $match: {
          project: new Types.ObjectId(projectId),
          deletedAt: null
        }
      },
      {
        $group: {
          _id: null,
          keywords: {
            $push: {
              keyword: '$keywords',
              keyword_volume: '$keyword_volume',
              keyword_difficulty: {
                $toUpper: { $ifNull: ['$keyword_difficulty', ''] }
              }
            }
          }
        }
      }
    ]);

    return result[0]?.keywords || [];
  }

  // Simplified access control - removed user assignment filtering

  // Removed sendAssignMailAndNotification method

  async generateBusinessSummary(website_url: string, authToken?: string) {
    console.log('hi')
    const result = await this.pythonService.companyBusinessSummary(website_url);

    if (!result.company_details) {
      throw new InternalServerErrorException(
        PROJECTS_STRING.ERROR.FAILED_TO_FETCH_BUSINESS_DESCRIPTION,
      );
    }

    return result;
  }

  async requestSiteAudit(projectId: string, user: User) {
    const project = await this.findOne(projectId);
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    if (!project.website_url) {
      throw new NotFoundException(
        PROJECTS_STRING.ERROR.PROJECT_WEBSITE_URL_NOT_FOUND,
      );
    }

    // Check if there's already a pending or in-progress audit
    const existingAudit = await this.siteAuditModel.findOne({
      project: project._id,
      status: { $in: [SiteAuditStatus.PENDING, SiteAuditStatus.IN_PROGRESS] },
    });

    if (existingAudit) {
      throw new BadRequestException(
        'Site audit is already in progress for this project',
      );
    }

    // Create new audit record
    const siteAudit = await this.siteAuditModel.create({
      project: project._id,
      user: user._id,
      url: project.website_url,
      status: SiteAuditStatus.PENDING,
      current_step: 'Initiating audit...',
      progress_steps: [],
    });

    // Start the chunked audit process asynchronously
    void this.processSiteAuditAsync(siteAudit.id, project.website_url);

    return {
      auditId: siteAudit.id,
      message: 'Site audit started successfully',
    };
  }

  private async processSiteAuditAsync(
    auditId: string,
    url: string,
  ): Promise<void> {
    try {
      await this.siteAuditModel.findByIdAndUpdate(auditId, {
        status: SiteAuditStatus.IN_PROGRESS,
        current_step: 'Starting audit process...',
      });

      await this.seoAuditService.processSiteAuditChunked(
        url,
        // onProgress callback
        async (step: string) => {
          try {
            // Update with Mongoose
            await this.siteAuditModel.findByIdAndUpdate(auditId, {
              current_step: step,
              $push: { progress_steps: step },
            });
          } catch (dbError) {
            this.logger.error(`Database update error for audit ${auditId}:`, {
              error: dbError.message,
              step: step.substring(0, 100), // Log first 100 chars of step
            });
            // Continue processing even if DB update fails
          }
        },
        // onComplete callback
        async (report: any) => {
          try {
            await this.siteAuditModel.findByIdAndUpdate(auditId, {
              status: SiteAuditStatus.COMPLETED,
              current_step: 'Audit completed successfully',
              audit_report: report,
            });
          } catch (dbError) {
            this.logger.error(
              `Database update error on completion for audit ${auditId}:`,
              {
                error: dbError.message,
              },
            );
          }
        },
        // onError callback
        async (error: string) => {
          try {
            await this.siteAuditModel.findByIdAndUpdate(auditId, {
              status: SiteAuditStatus.FAILED,
              current_step: 'Audit failed',
              error_message: error,
            });
          } catch (dbError) {
            this.logger.error(
              `Database update error on failure for audit ${auditId}:`,
              {
                error: dbError.message,
                originalError: error,
              },
            );
          }
        },
      );
    } catch (error) {
      this.logger.error(
        `Error processing site audit ${auditId}: ${error.message}`,
      );
      try {
        await this.siteAuditModel.findByIdAndUpdate(auditId, {
          status: SiteAuditStatus.FAILED,
          current_step: 'Audit failed',
          error_message: error.message,
        });
      } catch (dbError) {
        this.logger.error(
          `Failed to update database after audit error for audit ${auditId}:`,
          {
            originalError: error.message,
            dbError: dbError.message,
          },
        );
      }
    }
  }

  async checkSeoAuditProgress(projectId: string): Promise<{
    status: SiteAuditStatus;
    current_step: string;
    progress_steps: string[];
    error_message?: string;
  }> {
    const project = await this.findOne(projectId);
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    const siteAudit = await this.siteAuditModel.findOne({
      project: project._id,
    }).sort({ createdAt: -1 });

    if (!siteAudit) {
      throw new NotFoundException('No site audit found for this project');
    }

    return {
      status: siteAudit.status,
      current_step: siteAudit.current_step || 'Unknown',
      progress_steps: siteAudit.progress_steps || [],
      error_message: siteAudit.error_message,
    };
  }

  async getAuditReport(projectId: string) {
    const project = await this.findOne(projectId);
    if (!project) {
      throw new NotFoundException(PROJECTS_STRING.ERROR.PROJECT_NOT_FOUND);
    }

    const siteAudit = await this.siteAuditModel.findOne({
      project: project._id,
      status: SiteAuditStatus.COMPLETED,
    }).sort({ created_at: -1 });

    if (!siteAudit) {
      throw new NotFoundException(
        'No completed audit report found for this project',
      );
    }

    return siteAudit.audit_report;
  }
}
