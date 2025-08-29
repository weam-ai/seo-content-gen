import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Param,
  Patch,
  Delete,
  Query,
  Req,
  ParseBoolPipe,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@shared/pipes/parse-objectid.pipe';
import { Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  UpdateProjectDto,
} from './dto/update-project.dto';
// Removed ProjectBulkAssignDto import - functionality no longer supported
import {
  successResponseWithData,
  successPaginationResponseWithData,
  successResponse,
} from '@shared/utils/reponses.utils';
import { PROJECTS_STRING } from '@shared/utils/string.utils';
import { instanceToPlain } from 'class-transformer';
// TODO: Re-implement when User entity is available
// import { User } from '../users/entities/user.entity';

// Minimal User interface for type safety
interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
}
import { ListProjectDtoQuery } from './dto/list-project.dto';
import { AddKeywordsDto } from './dto/keyword-metrics.dto';
import { DataForSeoService } from '@shared/services/dataforseo.service';
import { TargetedKeyword } from '@/shared/types/articles.t';
import { GenerateBusinessSummaryRequest } from './dto/business-summary.dto';

import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly dataForSeoService: DataForSeoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const project = await this.projectsService.create(
      createProjectDto,
      req.user as User,
    );
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.PROJECT_CREATED,
      project.toJSON(),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() query: ListProjectDtoQuery,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { paginationData, projects } = await this.projectsService.findAll(
      query,
      req.user as User,
    );

    if (query?.limit !== 0 && query?.limit !== -1) {
      return successPaginationResponseWithData(
        paginationData,
        res,
        PROJECTS_STRING.SUCCESS.PROJECT_FETCHED,
        projects,
      );
    } else {
      return successResponseWithData(
        res,
        PROJECTS_STRING.SUCCESS.PROJECT_FETCHED,
        projects,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const project = await this.projectsService.findOne(id, req.user);
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.PROJECT_FETCHED,
      project,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() UpdateProjectDto: Partial<UpdateProjectDto>,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const projectUpdated = await this.projectsService.update(
      id,
      UpdateProjectDto,
      req.user as User,
    );
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.PROJECT_UPDATED,
      projectUpdated,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.projectsService.remove(id, req.user as User);
    return successResponse(res, PROJECTS_STRING.SUCCESS.PROJECT_DELETED);
  }

  @Post('/fetch-keyword-metrics')
  async fetchKeywordMetrics(
    @Body() addKeywordsDto: AddKeywordsDto,
    @Res() res: Response,
  ) {
    const keywordMetrics = await this.dataForSeoService.fetchKeywordMetrics(
      addKeywordsDto.keywords.map((e: TargetedKeyword) => e.keyword),
    );
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.KEYWORD_METRICS_FETCHED,
      keywordMetrics,
    );
  }

  @Post('/:projectId/add-keywords')
  @UseGuards(JwtAuthGuard)
  async addProjectKeywords(
    @Req() req: Request,
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Body() data: AddKeywordsDto,
    @Res() res: Response,
  ) {
    const keywordMatrix = await this.projectsService.addNewKeywords(
      projectId,
      data['keywords'],
      req.user!,
      data.secondary_keywords,
    );

    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.KEYWORD_METRICS_FETCHED,
      keywordMatrix ?? {},
    );
  }

  // Removed getProjectAssignedUsers endpoint

  @Get(':id/sitemap')
  async getProjectCompleteSitemap(
    @Param('id', ParseObjectIdPipe) projectId: string,
    @Res() res: Response,
    @Query('refresh', new ParseBoolPipe({ optional: true })) refresh: boolean,
  ) {
    const result = await this.projectsService.getProjectSiteMap(
      projectId,
      refresh,
    );
    if (!result) {
      return successResponse(res, PROJECTS_STRING.ERROR.SITEMAP_DATA_NOT_FOUND);
    }
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.PROJECT_SITEMAP_FETCH,
      result,
    );
  }

  /**
   * @description Fetch recommended keyword from project's existing keywords
   * @param projectId
   * @param res
   * @returns
   */
  @Get(':projectId/fetch-keyword-recommendation')
  async fetchKeywordRecommendation(
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Res() res: Response,
  ) {
    const keywordRecommendation =
      await this.projectsService.fetchKeywordRecommendation(projectId);
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.KEYWORD_RECOMMENDATION_FETCHED,
      keywordRecommendation,
    );
  }

  /**
   * @description Fetch recommended keyword from any keyword
   * @param keyword
   * @param res
   * @returns
   */

  @Post('/recommended-keywords')
  async getRecommendedKeywords(
    @Body('keyword', new ValidationPipe({})) keyword: string,
    @Res() res: Response,
  ) {
    const recommendedKeywords =
      await this.dataForSeoService.fetchRecommendedKeywords([keyword]);
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.RECOMMENDED_KEYWORD_FETCHED,
      recommendedKeywords,
    );
  }

  // Removed projectMemberDelete endpoint

  // Removed project-bulk-assign endpoint - functionality no longer supported

  @Post('/business-summary')
  async businessSummary(
    @Body() generateBusinessSummary: GenerateBusinessSummaryRequest,
    @Res() res: Response,
  ) {
    const business_summary = await this.projectsService.generateBusinessSummary(
      generateBusinessSummary.website_url,
    );
    return successResponseWithData(
      res,
      PROJECTS_STRING.SUCCESS.BUSINESS_DESCRIPTION_GENERATED,
      business_summary,
    );
  }

  @Post(':projectId/site-audit')
  async requestSiteAudit(
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Res() res: Response,
  ) {
    await this.projectsService.requestSiteAudit(projectId);
    return successResponse(res, 'SEO audit started');
  }

  @Get(':projectId/site-audit/progress')
  async checkSiteAuditProgress(
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Res() res: Response,
  ) {
    const progress =
      await this.projectsService.checkSeoAuditProgress(projectId);
    return successResponseWithData(res, 'SEO audit progress', progress);
  }

  @Get(':projectId/site-audit/report')
  async getSiteAuditReport(
    @Param('projectId', ParseObjectIdPipe) projectId: string,
    @Res() res: Response,
  ) {
    // const report = this.seoAuditService.getSeoAuditReportById(projectId);
    const report = await this.projectsService.getAuditReport(projectId);
    return successResponseWithData(res, 'SEO audit report', report);
  }
}
