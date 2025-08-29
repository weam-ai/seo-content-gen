import {
  Controller,
  Get,
  Post,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import connectToMongoDB, { mongoose } from './config/data-source';
import { logger } from '@shared/utils/logger.utils';
import { StaticTokenGuard } from './shared/guards/static-token.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      message: 'Health check successful',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @UseGuards(StaticTokenGuard)
  @Post('run-migrations')
  async runMigrations(@Res() res): Promise<any> {
    try {
      if (mongoose.connection.readyState !== 1) {
        await connectToMongoDB();
      }
      // MongoDB doesn't use migrations like TypeORM
      // This endpoint now just ensures database connection
      logger.info('MongoDB connection verified successfully');
      return res.status(HttpStatus.OK).json({
        message: 'Database connection verified',
        status: 'connected',
      } as {
        message: string;
        status: string;
      });
    } catch (error) {
      logger.error('Database connection error: ' + error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Database connection failed',
        error: (error as Error).message,
      } as { message: string; error: string });
    }
  }
}
