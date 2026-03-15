import { LiveMatchService } from './live-match.service';

describe('LiveMatchService', () => {
  let service: LiveMatchService;

  const matchesServiceMock = {} as any;
  const footballApiServiceMock = {
    getMatch: jest.fn(),
  };
  const matchGatewayMock = {
    broadcastMatchUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    service = new LiveMatchService(
      matchesServiceMock,
      footballApiServiceMock as any,
      matchGatewayMock as any,
    );
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.stopAllPolling();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('starts polling once and ignores duplicate polling requests', async () => {
    footballApiServiceMock.getMatch.mockResolvedValue({
      status: 'IN_PLAY',
      score: { fullTime: { home: 1, away: 0 }, halfTime: { home: 1, away: 0 } },
      minute: 10,
    });

    await service.startPolling('10');
    await service.startPolling('10');

    expect(service.getPolledMatches()).toEqual(['10']);
    expect(footballApiServiceMock.getMatch).toHaveBeenCalledTimes(1);
  });

  it('stops polling and clears cached state for a match', async () => {
    footballApiServiceMock.getMatch.mockResolvedValue({
      status: 'IN_PLAY',
      score: { fullTime: { home: 0, away: 0 }, halfTime: { home: 0, away: 0 } },
    });

    await service.startPolling('7');
    service.stopPolling('7');

    expect(service.getPolledMatches()).toEqual([]);
    expect((service as any).lastMatchData.has('7')).toBe(false);
  });

  it('stops polling when a match can no longer be fetched', async () => {
    footballApiServiceMock.getMatch.mockResolvedValue(null);
    const stopSpy = jest.spyOn(service, 'stopPolling');

    await (service as any).pollMatch('22');

    expect(stopSpy).toHaveBeenCalledWith('22');
    expect(matchGatewayMock.broadcastMatchUpdate).not.toHaveBeenCalled();
  });

  it('broadcasts a final update and stops polling for finished matches', async () => {
    footballApiServiceMock.getMatch.mockResolvedValue({
      status: 'FINISHED',
      score: { fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 1 } },
      minute: 90,
    });
    const stopSpy = jest.spyOn(service, 'stopPolling');

    await (service as any).pollMatch('9');

    expect(matchGatewayMock.broadcastMatchUpdate).toHaveBeenCalledWith(
      '9',
      expect.objectContaining({
        matchId: '9',
        status: 'FINISHED',
        minute: 90,
      }),
    );
    expect(stopSpy).toHaveBeenCalledWith('9');
  });

  it('broadcasts only when live match data changes', async () => {
    const matchData = {
      status: 'IN_PLAY',
      score: { fullTime: { home: 1, away: 1 }, halfTime: { home: 1, away: 0 } },
      minute: 55,
    };
    footballApiServiceMock.getMatch.mockResolvedValue(matchData);

    await (service as any).pollMatch('5');
    await (service as any).pollMatch('5');

    expect(matchGatewayMock.broadcastMatchUpdate).toHaveBeenCalledTimes(1);
    expect((service as any).lastMatchData.get('5')).toEqual(matchData);
  });

  it('swallows polling errors without crashing the loop', async () => {
    footballApiServiceMock.getMatch.mockRejectedValue(new Error('network failed'));

    await expect((service as any).pollMatch('3')).resolves.toBeUndefined();
    expect(matchGatewayMock.broadcastMatchUpdate).not.toHaveBeenCalled();
  });

  it('stops all polling on module destroy', async () => {
    footballApiServiceMock.getMatch.mockResolvedValue({
      status: 'IN_PLAY',
      score: { fullTime: { home: 0, away: 0 }, halfTime: { home: 0, away: 0 } },
    });

    await service.startPolling('1');
    await service.startPolling('2');
    service.onModuleDestroy();

    expect(service.getPolledMatches()).toEqual([]);
  });
});