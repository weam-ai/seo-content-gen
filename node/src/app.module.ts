import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { mongooseConfig } from '@config/typeorm.config';
// import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProjectsModule } from './modules/projects/projects.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ArticleModule } from './modules/article/article.module';
import { SystemPromptsModule } from './modules/system-prompts/system-prompts.module';
import { GuidelinesModule } from './modules/guidelines/guidelines.module';
import { ArticleDocumentsModule } from './modules/article-documents/article-documents.module';
import { SseModule } from './modules/sse/sse.module';
import { OpenaiModule } from './modules/openai/openai.module';
import { ClaudeModule } from './modules/claude/claude.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { PromptTypesModule } from './modules/prompt-types/prompt-types.module';
import { GuardsModule } from './shared/guards/guards.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

// Email and notification modules removed for single-user application

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: mongooseConfig,
    }),
    //BullMQ
    // BullModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     connection: {
    //       host: configService.get('REDIS_HOST', 'localhost'),
    //       port: configService.get('REDIS_PORT', 6379),
    //     },
    //   }),
    // }),
    //Throttle rate limit
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    EventEmitterModule.forRoot(),
    GuardsModule,
    ProjectsModule,
    ArticleModule,
    SystemPromptsModule,
    GuidelinesModule,
    ArticleDocumentsModule,
    SseModule,
    OpenaiModule,
    ClaudeModule,
    GeminiModule,
    PromptTypesModule,
    WebhooksModule,

    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // No middleware configuration needed - using JWT guards
  }
}
