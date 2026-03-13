import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { timer } from 'rxjs';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private logger = inject(LoggerService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      // Retry failed requests (except for auth endpoints and non-GET requests)
      retry({
        count: 2,
        delay: (error) => {
          if (!this.shouldRetry(request, error)) {
            throw error;
          }
          return timer(1000);
        },
      }),
      catchError((error: HttpErrorResponse) => {
        // Log the error for debugging
        this.logError(error, request);

        // Transform the error to a more user-friendly format
        const enhancedError = this.enhanceError(error);

        return throwError(() => enhancedError);
      })
    );
  }

  private shouldRetry(request: HttpRequest<any>, error: HttpErrorResponse): boolean {
    // Don't retry auth endpoints or non-GET requests
    const isAuthEndpoint = request.url.includes('/auth/');
    const isPredictionEndpoint = request.url.includes('/prediction/');
    const isGetRequest = request.method === 'GET';

    // Retry only transient failures (network / 5xx), never retry 4xx like 401.
    const isTransientError = error.status === 0 || error.status >= 500;

    return !isAuthEndpoint && !isPredictionEndpoint && isGetRequest && isTransientError;
  }

  private logError(error: HttpErrorResponse, request: HttpRequest<any>): void {
    if (this.shouldSuppressExpectedAuthNoise(error, request)) {
      return;
    }

    const timestamp = new Date().toISOString();
    
    console.group(`🔴 HTTP Error [${timestamp}]`);
    this.logger.error('Request:', {
      method: request.method,
      url: request.url,
      body: request.body
    });
    this.logger.error('Response:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message
    });
    console.groupEnd();
  }

  private shouldSuppressExpectedAuthNoise(
    error: HttpErrorResponse,
    request: HttpRequest<any>,
  ): boolean {
    if (error.status !== 401) {
      return false;
    }

    const url = request.url || '';
    const isPassiveNotificationPoll =
      url.includes('/alerts/unread') || url.includes('/alerts/counts/by-type');
    const isRefresh = url.includes('/auth/refresh');

    return isPassiveNotificationPoll || isRefresh;
  }

  private enhanceError(error: HttpErrorResponse): HttpErrorResponse {
    // Add additional context to the error
    const enhancedError = new HttpErrorResponse({
      error: error.error,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url || undefined
    });

    // Add custom properties for easier error handling
    (enhancedError as any).timestamp = new Date().toISOString();
    (enhancedError as any).isNetworkError = error.status === 0;
    (enhancedError as any).isServerError = error.status >= 500;
    (enhancedError as any).isClientError = error.status >= 400 && error.status < 500;

    return enhancedError;
  }
}
