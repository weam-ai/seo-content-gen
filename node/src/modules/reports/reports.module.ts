import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '@modules/projects/entities/projects.entity';
import { Article, ArticleSchema } from '@modules/article/entities/article.entity';
import { EmailModule } from '@shared/modules/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Article.name, schema: ArticleSchema },
    ]),
    EmailModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
