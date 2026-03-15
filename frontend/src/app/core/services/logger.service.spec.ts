import { TestBed } from '@angular/core/testing';

import { LoggerService } from './logger.service';
import { ErrorLoggingService } from './error-logging.service';

describe('LoggerService', () => {
  let service: LoggerService;
  const errorLoggingMock = {
    logInfo: jasmine.createSpy('logInfo'),
    logWarning: jasmine.createSpy('logWarning'),
    logError: jasmine.createSpy('logError'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorLoggingService, useValue: errorLoggingMock }],
    });
    service = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    errorLoggingMock.logInfo.calls.reset();
    errorLoggingMock.logWarning.calls.reset();
    errorLoggingMock.logError.calls.reset();
  });

  it('forwards info and warning to error logging service', () => {
    service.info('i', { a: 1 });
    service.warn('w', { b: 2 });

    expect(errorLoggingMock.logInfo).toHaveBeenCalledWith('i', [{ a: 1 }]);
    expect(errorLoggingMock.logWarning).toHaveBeenCalledWith('w', [{ b: 2 }]);
  });

  it('forwards error and extracts stack when Error instance is provided', () => {
    const err = new Error('boom');

    service.error('e', { c: 3 }, err);

    expect(errorLoggingMock.logError).toHaveBeenCalledWith(
      'e',
      [{ c: 3 }, err],
      err.stack,
    );
  });

  it('does not call error logging on debug/log methods', () => {
    service.debug('d');
    service.log('l');

    expect(errorLoggingMock.logInfo).not.toHaveBeenCalled();
    expect(errorLoggingMock.logWarning).not.toHaveBeenCalled();
    expect(errorLoggingMock.logError).not.toHaveBeenCalled();
  });
});