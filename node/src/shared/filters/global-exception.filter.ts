import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let errorResponse: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : errorResponse.message;
    } else {
      // Handle non-HTTP exceptions (like database errors, API errors, etc.)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log the full error for debugging
      this.logger.error('Unhandled exception:', {
        error: exception,
        stack: exception instanceof Error ? exception.stack : undefined,
        url: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
      });
    }

    // Send response to client
    const errorResponseToSend = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message || 'An error occurred',
    };

    response.status(status).json(errorResponseToSend);
  }
}
