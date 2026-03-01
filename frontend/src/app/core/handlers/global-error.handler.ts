import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../services/logger.service';
import { ErrorLoggingService } from '../services/error-logging.service';

/** Error types that warrant navigating to the /error page */
const CRITICAL_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Cannot read properties of null',
  'Maximum call stack size exceeded',
];

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastController);
  private logger = inject(LoggerService);
  private errorLogging = inject(ErrorLoggingService);
  private router = inject(Router);
  private zone = inject(NgZone);
  private readonly isDevelopment = !environment.production;

  async handleError(error: Error | HttpErrorResponse): Promise<void> {
    // Log to console in development
    if (this.isDevelopment) {
      this.logger.error('GlobalErrorHandler caught:', error);
    }

    let errorMessage = 'An unexpected error occurred';
    let errorDetails = '';

    if (error instanceof HttpErrorResponse) {
      // Server-side or network error
      errorMessage = this.getHttpErrorMessage(error);
      errorDetails = this.getHttpErrorDetails(error);
    } else if (error instanceof Error) {
      // Client-side error
      errorMessage = error.message || 'Client error occurred';
      errorDetails = error.stack || '';

      // Check if this is a critical / unrecoverable error
      if (this.isCritical(error)) {
        this.navigateToErrorPage();
        this.errorLogging.logError(errorMessage, errorDetails);
        return;
      }
    }

    // Log error details in development
    if (this.isDevelopment && errorDetails) {
      this.logger.error('Error details:', errorDetails);
    }

    // Show user-friendly error message
    await this.showErrorToast(errorMessage);

    // Always log to error logging service
    this.errorLogging.logError(errorMessage, errorDetails);
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      return `Network error: ${error.error.message}`;
    }

    // Backend returned an unsuccessful response code
    switch (error.status) {
      case 0:
        return 'Unable to connect to server. Please check your internet connection.';
      case 400:
        return error.error?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Access forbidden. You don\'t have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return error.error?.message || 'Conflict. This resource already exists.';
      case 422:
        return error.error?.message || 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return error.error?.message || `Server error (${error.status}). Please try again later.`;
    }
  }

  private getHttpErrorDetails(error: HttpErrorResponse): string {
    const details: string[] = [];
    details.push(`Status: ${error.status} ${error.statusText}`);
    details.push(`URL: ${error.url}`);
    
    if (error.error) {
      if (typeof error.error === 'string') {
        details.push(`Error: ${error.error}`);
      } else {
        details.push(`Error: ${JSON.stringify(error.error, null, 2)}`);
      }
    }
    
    return details.join('\n');
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toast.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private logErrorToService(error: Error | HttpErrorResponse, message: string, details: string): void {
    this.errorLogging.logError(message, details);
  }

  /** Check whether the error is critical / unrecoverable */
  private isCritical(error: Error): boolean {
    const msg = error.message ?? '';
    return CRITICAL_PATTERNS.some((p) => msg.includes(p));
  }

  /** Navigate to the /error page (runs inside NgZone so the Router works) */
  private navigateToErrorPage(): void {
    this.zone.run(() => {
      this.router.navigateByUrl('/error', { replaceUrl: true });
    });
  }
}
