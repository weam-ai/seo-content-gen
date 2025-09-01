import { Module, forwardRef } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Article, ArticleSchema } from './entities/article.entity';
import { Project, ProjectSchema } from '../projects/entities/projects.entity';
import { User, UserSchema } from '../users/entities/user.entity';
// EmailModule import removed - email functionality not supported
import { DataForSeoService, DataForSeoProvider } from '@shared/services/dataforseo.service';
import { HttpModule } from '@nestjs/axios';
import { OpenaiModule } from '../openai/openai.module';
import { ArticleContent, ArticleContentSchema } from './entities/article-content.entity';
import { PythonService } from '@shared/services/python.service';
import { ArticleDocumentsModule } from '../article-documents/article-documents.module';
import { PromptTypesModule } from '../prompt-types/prompt-types.module';
import { GeminiModule } from '../gemini/gemini.module';
import { ClaudeModule } from '../claude/claude.module';
// import { TimeTrackingModule } from '../time-tracking/time-tracking.module';

import { DocumentUpdates, DocumentUpdatesSchema } from '../article-documents/entities/document-update.entity';
import { PromptType, PromptTypeSchema } from '../prompt-types/entities/prompt-type.entity';
// import { AuthTokens, AuthTokensSchema } from '../auth/entities/auth-tokens.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: ArticleContent.name, schema: ArticleContentSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: PromptType.name, schema: PromptTypeSchema },
      // { name: Thread.name, schema: ThreadSchema },
  
      { name: DocumentUpdates.name, schema: DocumentUpdatesSchema },
      // { name: AuthTokens.name, schema: AuthTokensSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'razorcopy',
      signOptions: { expiresIn: '24h' },
    }),
    HttpModule,
    forwardRef(() => OpenaiModule),
    forwardRef(() => GeminiModule),
    forwardRef(() => ClaudeModule),
    ArticleDocumentsModule,
    PromptTypesModule,
    // EmailModule, // Removed - email functionality not supported
    // TimeTrackingModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, DataForSeoProvider, PythonService],
  exports: [ArticleService],
})
export class ArticleModule {}
