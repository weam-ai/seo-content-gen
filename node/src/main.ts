import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { logger } from '@shared/utils/logger.utils';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();
  // Temporarily disable global exception filter to debug callback error
  // app.useGlobalFilters(new AllExceptionsFilter());
  // Temporarily disable global validation pipe to debug callback error
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  //body parser limit
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(process.env.PORT ?? 9001);

  logger.log(
    'info',
    `Application is running on: http://localhost:${process.env.PORT ?? 9001}`,
  );
}

// Global error handlers to prevent app crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.log('error', 'Unhandled Rejection at:', {
    promise,
    reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.log('error', 'Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  // Don't exit the process, just log the error
});

bootstrap().catch((error) => {
  logger.log('error', 'Bootstrap failed:', error);
  process.exit(1);
});
