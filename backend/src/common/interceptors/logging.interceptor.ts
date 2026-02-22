import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    const sanitizedBody = this.sanitizeBody(body);

    this.logger.log(`→ [${method}] ${url} ${JSON.stringify(sanitizedBody)}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(`← [${method}] ${url} ${responseTime}ms`);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `✗ [${method}] ${url} ${responseTime}ms - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return {};

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }
}
