import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ErrorLoggingService } from './error-logging.service';

/**
 * Centralised logger that replaces direct `console.*` calls.
 *
 * - In development: logs to browser console **and** records via ErrorLoggingService.
 * - In production: silences `debug` / `info` / `log`; only `warn` and `error`
 *   are forwarded to ErrorLoggingService (no console output).
 */
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly isProd = environment.production;

  constructor(private errorLogging: ErrorLoggingService) {}

  /** Verbose / trace-level – never shown in prod */
  debug(message: string, ...data: unknown[]): void {
    if (!this.isProd) {
      // eslint-disable-next-line no-console
      console.debug(message, ...data);
    }
  }

  /** Informational – silenced in prod */
  info(message: string, ...data: unknown[]): void {
    if (!this.isProd) {
      // eslint-disable-next-line no-console
      console.info(message, ...data);
    }
    this.errorLogging.logInfo(message, data.length ? data : undefined);
  }

  /** General log – silenced in prod */
  log(message: string, ...data: unknown[]): void {
    if (!this.isProd) {
      // eslint-disable-next-line no-console
      console.log(message, ...data);
    }
  }

  /** Warning – always recorded */
  warn(message: string, ...data: unknown[]): void {
    if (!this.isProd) {
      // eslint-disable-next-line no-console
      console.warn(message, ...data);
    }
    this.errorLogging.logWarning(message, data.length ? data : undefined);
  }

  /** Error – always recorded (with optional stack) */
  error(message: string, ...data: unknown[]): void {
    if (!this.isProd) {
      // eslint-disable-next-line no-console
      console.error(message, ...data);
    }
    const err = data.find((d): d is Error => d instanceof Error);
    this.errorLogging.logError(message, data.length ? data : undefined, err?.stack);
  }
}
