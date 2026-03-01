import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastController);
  private logger = inject(LoggerService);
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
    }

    // Log error details in development
    if (this.isDevelopment && errorDetails) {
      this.logger.error('Error details:', errorDetails);
    }

    // Show user-friendly error message
    await this.showErrorToast(errorMessage);

    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment) {
      this.logErrorToService(error, errorMessage, errorDetails);
    }
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
    // TODO: Implement error logging service (e.g., Sentry, LogRocket, etc.)
    // Example:
    // this.errorLoggingService.logError({
    //   message,
    //   details,
    //   timestamp: new Date().toISOString(),
    //   userAgent: navigator.userAgent,
    //   url: window.location.href
    // });
    
    this.logger.warn('Error logging service not implemented. Error details:', { message, details });
  }
}
