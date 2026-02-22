import { Injectable } from '@angular/core';

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  details?: any;
  stack?: string;
  url?: string;
  userAgent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggingService {
  private readonly maxLogs = 100;
  private logs: ErrorLog[] = [];

  logError(message: string, details?: any, stack?: string): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      details,
      stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addLog(log);
    this.persistLog(log);
  }

  logWarning(message: string, details?: any): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      details,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addLog(log);
  }

  logInfo(message: string, details?: any): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      details,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addLog(log);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('error_logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private addLog(log: ErrorLog): void {
    this.logs.push(log);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private persistLog(log: ErrorLog): void {
    try {
      const storedLogs = localStorage.getItem('error_logs');
      const logs: ErrorLog[] = storedLogs ? JSON.parse(storedLogs) : [];
      
      logs.push(log);
      
      // Keep only last 50 errors in storage
      const recentLogs = logs.slice(-50);
      
      localStorage.setItem('error_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to persist error log:', error);
    }
  }
}
