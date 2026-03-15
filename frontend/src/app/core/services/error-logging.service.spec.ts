import { TestBed } from '@angular/core/testing';
import { ErrorLoggingService, ErrorLog } from './error-logging.service';

describe('ErrorLoggingService', () => {
  let service: ErrorLoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorLoggingService]
    });
    service = TestBed.inject(ErrorLoggingService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log an error and persist it', () => {
    service.logError('test error', { detail: 'data' }, 'test stack');
    const logs = service.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].message).toBe('test error');
    expect(logs[0].stack).toBe('test stack');

    const stored = JSON.parse(localStorage.getItem('error_logs') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].message).toBe('test error');
  });

  it('should log a warning', () => {
    service.logWarning('test warning', { detail: 'warn' });
    const logs = service.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('warn');
  });

  it('should log info', () => {
    service.logInfo('test info');
    const logs = service.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('info');
  });

  it('should return recent errors', () => {
    service.logError('err 1');
    service.logInfo('info 1');
    service.logError('err 2');
    const errors = service.getRecentErrors(5);
    expect(errors.length).toBe(2);
    expect(errors.every(e => e.level === 'error')).toBeTrue();
  });

  it('should clear logs', () => {
    service.logError('err 1');
    service.clearLogs();
    expect(service.getLogs().length).toBe(0);
    expect(localStorage.getItem('error_logs')).toBeNull();
  });

  it('should export logs as JSON string', () => {
    service.logInfo('info 1');
    const exported = service.exportLogs();
    expect(typeof exported).toBe('string');
    expect(exported).toContain('info 1');
  });

  it('should limit logs to maxLogs', () => {
    for (let i = 0; i < 110; i++) {
      service.logInfo('info ' + i);
    }
    expect(service.getLogs().length).toBe(100);
  });
});
