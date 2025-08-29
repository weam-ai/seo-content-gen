import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Article } from '@modules/article/entities/article.entity';
import { Project } from '@modules/projects/entities/projects.entity';
import { User } from '@modules/users/entities/user.entity';
import { EmailService } from '@/shared/modules/email/email.service';
import { Model } from 'mongoose';
import { subWeeks, startOfWeek, endOfWeek, format } from 'date-fns';

interface ReportData {
  current: number;
  previous: number;
  totalTillLastWeek: number;
  change: number;
  changePercentage: string;
}

interface WeeklyReport {
  projects: ReportData;
  topics: ReportData;
  articles: ReportData;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    private readonly emailService: EmailService,
  ) {}

  @Cron('0 9 * * 1') // Every Monday at 9 AM
  async handleCron() {
    this.logger.debug('Generating weekly report...');
    await this.sendWeeklyReport();
  }

  async sendWeeklyReport() {
    this.logger.debug('Sending weekly report...');
    const today = new Date();
    const reportWeekStartDate = startOfWeek(subWeeks(today, 1), {
      weekStartsOn: 1,
    });
    const reportWeekEndDate = endOfWeek(subWeeks(today, 1), {
      weekStartsOn: 1,
    });

    const report = await this.getWeeklyReportData(
      reportWeekStartDate,
      reportWeekEndDate,
    );

    const emails = process.env.REPORT_EMAILS;
    if (!emails) {
      this.logger.warn('No report emails configured. Skipping sending report.');
      return;
    }

    const subject = `Weekly Report: ${format(
      reportWeekStartDate,
      'MMM d',
    )} - ${format(reportWeekEndDate, 'MMM d, yyyy')}`;

    await this.emailService.sendMailWithTemplate(
      emails.split(','),
      'weekly-report.email.ejs',
      subject,
      {
        report,
        week: {
          start: format(reportWeekStartDate, 'MMM d'),
          end: format(reportWeekEndDate, 'MMM d, yyyy'),
        },
      },
    );
  }

  private async getWeeklyReportData(
    reportWeekStartDate: Date,
    reportWeekEndDate: Date,
  ): Promise<WeeklyReport> {
    const projects = await this.getProjectsReport(
      reportWeekStartDate,
      reportWeekEndDate,
    );
    const topics = await this.getTopicsReport(
      reportWeekStartDate,
      reportWeekEndDate,
    );
    const articles = await this.getArticlesReport(
      reportWeekStartDate,
      reportWeekEndDate,
    );

    return {
      projects,
      topics,
      articles,
    };
  }

  private calculateChange(
    current: number,
    previous: number,
    totalTillLastWeek: number,
  ): ReportData {
    const change = current; // This week's count is the "change"
    const changePercentage =
      totalTillLastWeek > 0
        ? ((current / totalTillLastWeek) * 100).toFixed(2) + '%'
        : current > 0
          ? 'New'
          : '0%';
    return { current, previous, totalTillLastWeek, change, changePercentage };
  }





  private async getProjectsReport(
    reportWeekStartDate: Date,
    reportWeekEndDate: Date,
  ): Promise<ReportData> {
    const previousWeekStartDate = subWeeks(reportWeekStartDate, 1);
    const previousWeekEndDate = subWeeks(reportWeekEndDate, 1);

    const currentWeekProjects = await this.projectModel.countDocuments({
      created_at: { $gte: reportWeekStartDate, $lte: reportWeekEndDate },
    });
    const lastWeekProjects = await this.projectModel.countDocuments({
      created_at: { $gte: previousWeekStartDate, $lte: previousWeekEndDate },
    });
    const totalTillLastWeek = await this.projectModel.countDocuments({
      created_at: { $lt: reportWeekStartDate },
    });

    return this.calculateChange(
      currentWeekProjects,
      lastWeekProjects,
      totalTillLastWeek,
    );
  }

  private async getTopicsReport(
    reportWeekStartDate: Date,
    reportWeekEndDate: Date,
  ): Promise<ReportData> {
    const previousWeekStartDate = subWeeks(reportWeekStartDate, 1);
    const previousWeekEndDate = subWeeks(reportWeekEndDate, 1);

    const currentWeekTopics = await this.articleModel.countDocuments({
      created_at: { $gte: reportWeekStartDate, $lte: reportWeekEndDate },
      status: { $in: ['pending', 'rejected'] },
    });
    const lastWeekTopics = await this.articleModel.countDocuments({
      created_at: { $gte: previousWeekStartDate, $lte: previousWeekEndDate },
      status: { $in: ['pending', 'rejected'] },
    });
    const totalTillLastWeek = await this.articleModel.countDocuments({
      created_at: { $lt: reportWeekStartDate },
      status: { $in: ['pending', 'rejected'] },
    });

    return this.calculateChange(
      currentWeekTopics,
      lastWeekTopics,
      totalTillLastWeek,
    );
  }

  private async getArticlesReport(
    reportWeekStartDate: Date,
    reportWeekEndDate: Date,
  ): Promise<ReportData> {
    const previousWeekStartDate = subWeeks(reportWeekStartDate, 1);
    const previousWeekEndDate = subWeeks(reportWeekEndDate, 1);

    const currentWeekArticles = await this.articleModel.countDocuments({
      created_at: { $gte: reportWeekStartDate, $lte: reportWeekEndDate },
      status: { $nin: ['pending', 'rejected'] },
    });
    const lastWeekArticles = await this.articleModel.countDocuments({
      created_at: { $gte: previousWeekStartDate, $lte: previousWeekEndDate },
      status: { $nin: ['pending', 'rejected'] },
    });
    const totalTillLastWeek = await this.articleModel.countDocuments({
      created_at: { $lt: reportWeekStartDate },
      status: { $nin: ['pending', 'rejected'] },
    });

    return this.calculateChange(
      currentWeekArticles,
      lastWeekArticles,
      totalTillLastWeek,
    );
  }


}
