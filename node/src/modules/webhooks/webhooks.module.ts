import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { ArticleModule } from '../article/article.module';
import { SseModule } from '../sse/sse.module';

@Module({
  controllers: [WebhooksController],
  imports: [ArticleModule, SseModule],
})
export class WebhooksModule {}