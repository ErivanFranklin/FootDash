import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FootballApiCacheService } from './football-api-cache.service';

const redisMock: any = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn(),
  info: jest.fn(),
  dbsize: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => redisMock),
}));

describe('FootballApiCacheService', () => {
  let service: FootballApiCacheService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    redisMock.connect.mockResolvedValue(undefined);
    redisMock.quit.mockResolvedValue('OK');
    redisMock.set.mockResolvedValue('OK');
    redisMock.del.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FootballApiCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') return 'redis://localhost:6379';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FootballApiCacheService>(FootballApiCacheService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization', () => {
    it('should connect to redis on module init if enabled', async () => {
      await service.onModuleInit();
      expect(redisMock.connect).toHaveBeenCalled();
    });

    it('should handle redis connection timeout', async () => {
      redisMock.connect.mockReturnValue(new Promise(() => {}));
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();
      (service as any).connectTimeoutMs = 1;
      await service.onModuleInit();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Redis connection failed'));
      expect(redisMock.disconnect).toHaveBeenCalled();
      expect(service.isAvailable()).toBe(false);
    });

    it('should handle redis connection error', async () => {
      redisMock.connect.mockRejectedValue(new Error('Conn fail'));
      await service.onModuleInit();
      expect(redisMock.disconnect).toHaveBeenCalled();
      expect(service.isAvailable()).toBe(false);
    });

    it('should skip init if redis URL is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const disabledService = new FootballApiCacheService(configService);
      await disabledService.onModuleInit();
      expect(disabledService.isAvailable()).toBe(false);
    });
  });

  describe('Module Destroy', () => {
    it('should quit redis on destroy', async () => {
      (service as any).redis = redisMock;
      await service.onModuleDestroy();
      expect(redisMock.quit).toHaveBeenCalled();
    });
  });

  describe('Cache Operations', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      (service as any).redis = redisMock;
    });

    it('should build deterministic key', () => {
      const key1 = service.buildKey('test', { b: 2, a: 1, c: null, d: undefined });
      const key2 = service.buildKey('test', { a: 1, b: 2 });
      expect(key1).toBe('footdash:api:test:a=1&b=2');
      expect(key1).toBe(key2);
    });

    it('should get value from cache', async () => {
      const data = { foo: 'bar' };
      redisMock.get.mockResolvedValue(JSON.stringify(data));
      const result = await service.get('some-key');
      expect(redisMock.get).toHaveBeenCalledWith('some-key');
      expect(result).toEqual(data);
    });

    it('should return null on cache miss', async () => {
      redisMock.get.mockResolvedValue(null);
      const result = await service.get('miss');
      expect(result).toBeNull();
    });

    it('should return null and log warning on get error', async () => {
      redisMock.get.mockRejectedValue(new Error('Redis error'));
      const loggerSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();
      const result = await service.get('error-key');
      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should set value in cache', async () => {
      const data = { bar: 'baz' };
      await service.set('my-key', data, 60);
      expect(redisMock.set).toHaveBeenCalledWith('my-key', JSON.stringify(data), 'EX', 60);
    });

    it('should use default TTL if not provided', async () => {
      await service.set('my-key', {});
      expect(redisMock.set).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'EX', 300);
    });

    it('should log warning on set error', async () => {
      redisMock.set.mockRejectedValue(new Error('Set error'));
      const loggerSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();
      await service.set('err', {});
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should delete key', async () => {
      await service.del('target');
      expect(redisMock.del).toHaveBeenCalledWith('target');
    });

    it('should invalidate by pattern', async () => {
      redisMock.keys.mockResolvedValue(['key1', 'key2']);
      const count = await service.invalidatePattern('fixtures:*');
      expect(redisMock.keys).toHaveBeenCalledWith('footdash:api:fixtures:*');
      expect(redisMock.del).toHaveBeenCalledWith('key1', 'key2');
      expect(count).toBe(2);
    });

    it('should return 0 if no keys match pattern', async () => {
      redisMock.keys.mockResolvedValue([]);
      const count = await service.invalidatePattern('none');
      expect(count).toBe(0);
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('Stats and Availability', () => {
    it('should return stats when available', async () => {
      await service.onModuleInit();
      (service as any).redis = redisMock;
      redisMock.info.mockResolvedValue('used_memory_human:1.5M\nother_info:xyz');
      redisMock.dbsize.mockResolvedValue(100);
      const stats = await service.getStats();
      expect(stats.available).toBe(true);
      expect(stats.keys).toBe(100);
      expect(stats.memory).toBe('1.5M');
    });

    it('should return default memory if regex fails', async () => {
        await service.onModuleInit();
        (service as any).redis = redisMock;
        redisMock.info.mockResolvedValue('no_mem_info');
        const stats = await service.getStats();
        expect(stats.memory).toBe('unknown');
    });

    it('should return unavailable stats if redis error', async () => {
      await service.onModuleInit();
      (service as any).redis = redisMock;
      redisMock.info.mockRejectedValue(new Error('fail'));
      const stats = await service.getStats();
      expect(stats.available).toBe(false);
    });

    it('should return unavailable if redis not initialized', async () => {
      (service as any).redis = null;
      const stats = await service.getStats();
      expect(stats.available).toBe(false);
    });
  });
});
