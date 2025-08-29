import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('send')
  async sendReport() {
    await this.reportsService.sendWeeklyReport();
    return { message: 'Weekly report generation started.' };
  }
}
