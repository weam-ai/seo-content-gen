import { Module, forwardRef } from '@nestjs/common';
import { ArticleDocumentsService } from './article-documents.service';
import { ArticleDocumentsController } from './article-documents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { DocumentUpdates, DocumentUpdatesSchema } from './entities/document-update.entity';
import { Article, ArticleSchema } from '../article/entities/article.entity';
// import { OpenaiModule } from '@/modules/openai/openai.module';
// import { TimeTrackingModule } from '../time-tracking/time-tracking.module';
// import { User, UserSchema } from '../users/entities/user.entity';
// import { AuthTokens, AuthTokensSchema } from '../auth/entities/auth-tokens.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentUpdates.name, schema: DocumentUpdatesSchema },
      { name: Article.name, schema: ArticleSchema },
      // { name: User.name, schema: UserSchema },
      // { name: AuthTokens.name, schema: AuthTokensSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
    // forwardRef(() => OpenaiModule),
    // TimeTrackingModule,
  ],
  providers: [ArticleDocumentsService],
  controllers: [ArticleDocumentsController],
  exports: [ArticleDocumentsService],
})
export class ArticleDocumentsModule {}
