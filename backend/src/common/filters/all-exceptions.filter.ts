import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(message),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
        details: message,
      }),
    };

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(message: string | object): string {
    if (typeof message === 'string') {
      return message;
    }

    if (typeof message === 'object' && message !== null) {
      if ('message' in message) {
        if (Array.isArray(message.message)) {
          return message.message.join(', ');
        }
        return String(message.message);
      }
      if ('error' in message) {
        return String(message.error);
      }
    }

    return 'An error occurred';
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: any,
  ): void {
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const ip = headers['x-forwarded-for'] || request.ip || 'Unknown';

    const logContext = {
      timestamp: errorResponse.timestamp,
      statusCode: errorResponse.statusCode,
      method,
      url,
      ip,
      userAgent,
      body: this.sanitizeBody(body),
      query,
      params,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${method}] ${url} - ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(logContext, null, 2),
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(
        `[${method}] ${url} - ${errorResponse.message}`,
        JSON.stringify(logContext, null, 2),
      );
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
