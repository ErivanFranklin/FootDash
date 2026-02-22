import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(exceptionResponse),
      ...(process.env.NODE_ENV === 'development' && {
        error: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      }),
    };

    // Log based on severity
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${errorResponse.message}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if ('message' in exceptionResponse) {
        if (Array.isArray(exceptionResponse.message)) {
          return exceptionResponse.message.join(', ');
        }
        return String(exceptionResponse.message);
      }
    }

    return 'An error occurred';
  }
}
