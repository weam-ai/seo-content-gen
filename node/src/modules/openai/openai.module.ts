import { Module, forwardRef } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { OpenAiController } from './openai.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { PythonService } from '@shared/services/python.service';
import { ArticleModule } from '@modules/article/article.module';
import { ArticleDocumentsModule } from '@modules/article-documents/article-documents.module';
import { EmailModule } from '@shared/modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
    HttpModule,
    EmailModule,
    forwardRef(() => ArticleModule),
    forwardRef(() => ArticleDocumentsModule),
  ],
  providers: [OpenAIService, PythonService],
  controllers: [OpenAiController],
  exports: [OpenAIService],
})
export class OpenaiModule {}