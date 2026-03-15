import { TestBed } from '@angular/core/testing';

import { ErrorLoggingService } from './error-logging.service';

describe('ErrorLoggingService', () => {
  let service: ErrorLoggingService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorLoggingService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('logs error and persists to localStorage', () => {
    service.logError('failure', { code: 500 }, 'stacktrace');

    const logs = service.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].stack).toBe('stacktrace');

    const persisted = JSON.parse(localStorage.getItem('error_logs') || '[]');
    expect(persisted.length).toBe(1);
    expect(persisted[0].message).toBe('failure');
  });

  it('handles localStorage parse failures without throwing', () => {
    localStorage.setItem('error_logs', '{broken');

    expect(() => service.logError('safe', { x: 1 })).not.toThrow();
  });

  it('retains only latest max in-memory logs', () => {
    for (let i = 0; i < 120; i += 1) {
      service.logInfo(`info-${i}`);
    }

    const logs = service.getLogs();
    expect(logs.length).toBe(100);
    expect(logs[0].message).toBe('info-20');
    expect(logs[99].message).toBe('info-119');
  });

  it('getRecentErrors returns only last error entries', () => {
    service.logInfo('i-1');
    service.logError('e-1');
    service.logWarning('w-1');
    service.logError('e-2');

    const recent = service.getRecentErrors(1);
    expect(recent.length).toBe(1);
    expect(recent[0].message).toBe('e-2');
  });

  it('clearLogs and exportLogs work as expected', () => {
    service.logWarning('warn');
    expect(service.exportLogs()).toContain('warn');

    service.clearLogs();

    expect(service.getLogs()).toEqual([]);
    expect(localStorage.getItem('error_logs')).toBeNull();
  });
});