import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { logger } from '../utils/logger.utils';
import { COMMON_ERROR_STRING } from '../utils/string.utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = COMMON_ERROR_STRING.INTERNAL_SERVER_ERROR;
    let stackTrace = '';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      // Handle HTTP Exceptions
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        message =
          (errorResponse as any).message || JSON.stringify(errorResponse);
      }
    } else if (exception instanceof Error) {
      // Handle General Errors (e.g., TypeError, SyntaxError, Database errors, etc.)
      message = exception.message;
      stackTrace = exception.stack || '';

      // Handle specific error types
      if (exception.name === 'QueryFailedError') {
        console.log(exception.message);
        errorCode = 'DATABASE_ERROR';
        message = 'Database operation failed';
      } else if (exception.message.includes('account_inactive')) {
        errorCode = 'EXTERNAL_SERVICE_ERROR';
        message = 'External service is unavailable';
      } else if (exception.message.includes('Unexpected token')) {
        errorCode = 'PARSING_ERROR';
        message = 'Data parsing failed';
      }
    } else {
      // Handle Unknown Errors (Non-Error objects thrown)
      message = 'Unknown error occurred';
      errorCode = 'UNKNOWN_ERROR';
    }

    // Enhanced logging with more context
    if (![HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND].includes(status)) {
      logger.log('error', {
        status,
        message,
        errorCode,
        url: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        stack: stackTrace,
        timestamp: new Date().toISOString(),
      });
    }

    const basicResponse = {
      status: false,
      message,
    };

    if (process.env.NODE_ENV === 'local') {
      Object.assign(basicResponse, {
        errorCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    response.status(status).json(basicResponse);
  }
}
