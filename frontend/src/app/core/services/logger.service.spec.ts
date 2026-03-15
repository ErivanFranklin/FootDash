import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { ErrorLoggingService } from './error-logging.service';
import { environment } from '../../../environments/environment';

describe('LoggerService', () => {
  let service: LoggerService;
  let errorLoggingSpy: jasmine.SpyObj<ErrorLoggingService>;

  beforeEach(() => {
    errorLoggingSpy = jasmine.createSpyObj('ErrorLoggingService', ['logInfo', 'logWarning', 'logError']);

    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: ErrorLoggingService, useValue: errorLoggingSpy }
      ]
    });
    service = TestBed.inject(LoggerService);
    
    spyOn(console, 'debug');
    spyOn(console, 'info');
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('in development mode', () => {
    beforeEach(() => {
      (service as any).isProd = false;
    });

    it('should call console.debug', () => {
      service.debug('test debug');
      expect(console.debug).toHaveBeenCalled();
    });

    it('should call console.info and logInfo', () => {
      service.info('test info', { data: 1 });
      expect(console.info).toHaveBeenCalled();
      expect(errorLoggingSpy.logInfo).toHaveBeenCalledWith('test info', [{ data: 1 }]);
    });

    it('should call console.log', () => {
      service.log('test log');
      expect(console.log).toHaveBeenCalled();
    });

    it('should call console.warn and logWarning', () => {
      service.warn('test warn');
      expect(console.warn).toHaveBeenCalled();
      expect(errorLoggingSpy.logWarning).toHaveBeenCalled();
    });

    it('should call console.error and logError', () => {
      const error = new Error('test error');
      service.error('error message', error);
      expect(console.error).toHaveBeenCalled();
      expect(errorLoggingSpy.logError).toHaveBeenCalled();
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      (service as any).isProd = true;
    });

    it('should NOT call console.debug', () => {
      service.debug('test debug');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should NOT call console.info but SHOULD call logInfo', () => {
      service.info('test info');
      expect(console.info).not.toHaveBeenCalled();
      expect(errorLoggingSpy.logInfo).toHaveBeenCalled();
    });
  });
});
