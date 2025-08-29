import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Project, ProjectSchema } from './entities/projects.entity';
import { ProjectActivity, ProjectActivitySchema } from './entities/project-activity.entity';
import { DataForSeoProvider } from '@shared/services/dataforseo.service';
import { HttpModule } from '@nestjs/axios';
import { RecommendedKeyword, RecommendedKeywordSchema } from './entities/recommended-keyword.entity';
import { PythonService } from '@shared/services/python.service';
import { EmailModule } from '@/shared/modules/email/email.module';
import { Article, ArticleSchema } from '../article/entities/article.entity';
import { ArticleService } from '../article/article.service';
import { ArticleContent, ArticleContentSchema } from '../article/entities/article-content.entity';
import { ArticleDocumentsModule } from '../article-documents/article-documents.module';
import { SeoAuditService } from '@shared/services/seo-audit.service';
import { SiteAudit, SiteAuditSchema } from './entities/site-audit.entity';
import { DocumentUpdates, DocumentUpdatesSchema } from '../article-documents/entities/document-update.entity';
import { PromptType, PromptTypeSchema } from '../prompt-types/entities/prompt-type.entity';
import { PromptTypesModule } from '../prompt-types/prompt-types.module';
import { GeminiModule } from '../gemini/gemini.module';
import { ClaudeModule } from '../claude/claude.module';
import { OpenaiModule } from '../openai/openai.module';
// Removed imports for deleted modules: User, AuthTokens, TimeTrackingModule, Thread, Comment

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectActivity.name, schema: ProjectActivitySchema },
      { name: RecommendedKeyword.name, schema: RecommendedKeywordSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: ArticleContent.name, schema: ArticleContentSchema },
      { name: SiteAudit.name, schema: SiteAuditSchema },
      { name: DocumentUpdates.name, schema: DocumentUpdatesSchema },
      { name: PromptType.name, schema: PromptTypeSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
    HttpModule,
    ArticleDocumentsModule,
    PromptTypesModule,
    EmailModule,
    GeminiModule,
    ClaudeModule,
    OpenaiModule,
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ArticleService,
    PythonService,
    DataForSeoProvider,
    SeoAuditService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
