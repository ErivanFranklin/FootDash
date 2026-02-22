import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      // Retry failed requests (except for auth endpoints and non-GET requests)
      retry({
        count: this.shouldRetry(request) ? 2 : 0,
        delay: 1000
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

  private shouldRetry(request: HttpRequest<any>): boolean {
    // Don't retry auth endpoints or non-GET requests
    const isAuthEndpoint = request.url.includes('/auth/');
    const isGetRequest = request.method === 'GET';
    
    return !isAuthEndpoint && isGetRequest;
  }

  private logError(error: HttpErrorResponse, request: HttpRequest<any>): void {
    const timestamp = new Date().toISOString();
    
    console.group(`🔴 HTTP Error [${timestamp}]`);
    console.error('Request:', {
      method: request.method,
      url: request.url,
      body: request.body
    });
    console.error('Response:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message
    });
    console.groupEnd();
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
