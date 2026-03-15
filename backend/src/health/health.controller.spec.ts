import { HealthController } from './health.controller';

describe('HealthController', () => {
  const healthMock = {
    check: jest.fn(),
  };
  const dbMock = {
    pingCheck: jest.fn(),
  };
  const memoryMock = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes all health indicators', async () => {
    dbMock.pingCheck.mockResolvedValue({ database: { status: 'up' } });
    memoryMock.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });
    memoryMock.checkRSS.mockResolvedValue({ memory_rss: { status: 'up' } });
    healthMock.check.mockImplementation(async (checks: Array<() => Promise<any>>) => {
      const values = await Promise.all(checks.map((fn) => fn()));
      return { details: values };
    });

    const controller = new HealthController(
      healthMock as any,
      dbMock as any,
      memoryMock as any,
    );

    const result = await controller.check();

    expect(dbMock.pingCheck).toHaveBeenCalledWith('database', { timeout: 3000 });
    expect(memoryMock.checkHeap).toHaveBeenCalledWith(
      'memory_heap',
      512 * 1024 * 1024,
    );
    expect(memoryMock.checkRSS).toHaveBeenCalledWith(
      'memory_rss',
      1024 * 1024 * 1024,
    );
    expect(result.details).toHaveLength(3);
  });
});
