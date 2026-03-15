import { MatchSchedulerService } from './match-scheduler.service';
import { MatchRangeType } from './dto/matches-query.dto';

describe('MatchSchedulerService', () => {
  let service: MatchSchedulerService;

  const matchesServiceMock = {
    syncFixturesFromApi: jest.fn(),
    getMatchesByDate: jest.fn(),
  };

  const liveMatchServiceMock = {
    getPolledMatches: jest.fn(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const teamRepositoryMock = {
    find: jest.fn(),
  };

  beforeEach(() => {
    service = new MatchSchedulerService(
      matchesServiceMock as any,
      liveMatchServiceMock as any,
      configServiceMock as any,
      teamRepositoryMock as any,
    );
    jest.clearAllMocks();
  });

  it('onModuleInit schedules an initial live-match check', async () => {
    jest.useFakeTimers();
    const checkSpy = jest
      .spyOn(service, 'checkAndUpdateLiveMatches')
      .mockResolvedValue(undefined);

    await service.onModuleInit();
    jest.runOnlyPendingTimers();

    expect(checkSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('dailyFixtureSync exits early in mock mode', async () => {
    configServiceMock.get.mockReturnValue(true);

    await service.dailyFixtureSync();

    expect(teamRepositoryMock.find).not.toHaveBeenCalled();
    expect(matchesServiceMock.syncFixturesFromApi).not.toHaveBeenCalled();
  });

  it('dailyFixtureSync syncs favorite teams and handles per-team errors', async () => {
    jest.useFakeTimers();
    configServiceMock.get.mockReturnValue(false);
    teamRepositoryMock.find.mockResolvedValue([
      { name: 'A', externalId: 33 },
      { name: 'B', externalId: 40 },
    ]);
    const sleepSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });
    matchesServiceMock.syncFixturesFromApi
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('team B failed'));

    await service.dailyFixtureSync();

    expect(matchesServiceMock.syncFixturesFromApi).toHaveBeenCalledWith(
      33,
      expect.objectContaining({ range: MatchRangeType.RECENT }),
    );
    expect(matchesServiceMock.syncFixturesFromApi).toHaveBeenCalledWith(
      33,
      expect.objectContaining({ range: MatchRangeType.UPCOMING }),
    );
    expect(matchesServiceMock.syncFixturesFromApi).toHaveBeenCalledWith(
      40,
      expect.objectContaining({ range: MatchRangeType.RECENT }),
    );

    sleepSpy.mockRestore();
    jest.useRealTimers();
  });

  it('starts polling new live matches and stops stale polled matches', async () => {
    jest
      .spyOn<any, any>(service as any, 'findLiveMatches')
      .mockResolvedValue([{ id: 1 }, { id: 2 }]);
    liveMatchServiceMock.getPolledMatches.mockReturnValue(['2', '9']);

    await service.checkAndUpdateLiveMatches();

    expect(liveMatchServiceMock.startPolling).toHaveBeenCalledWith('1');
    expect(liveMatchServiceMock.startPolling).not.toHaveBeenCalledWith('2');
    expect(liveMatchServiceMock.stopPolling).toHaveBeenCalledWith('9');
  });

  it('swallows errors in scheduled live-match checks', async () => {
    jest
      .spyOn<any, any>(service as any, 'findLiveMatches')
      .mockRejectedValue(new Error('find failed'));

    await expect(service.checkAndUpdateLiveMatches()).resolves.toBeUndefined();
  });

  it('findLiveMatches filters status and kickoff window correctly', async () => {
    const now = new Date();
    matchesServiceMock.getMatchesByDate.mockResolvedValue([
      { id: 1, status: 'IN_PLAY' },
      { id: 2, status: 'SCHEDULED', kickOff: new Date(now.getTime() + 10 * 60 * 1000) },
      { id: 3, status: 'SCHEDULED', kickOff: new Date(now.getTime() + 90 * 60 * 1000) },
      { id: 4, status: 'FINISHED' },
    ]);

    const live = await (service as any).findLiveMatches();

    expect(live.map((m: any) => m.id)).toEqual([1, 2]);
  });

  it('findLiveMatches returns empty list when repository lookup fails', async () => {
    matchesServiceMock.getMatchesByDate.mockRejectedValue(new Error('db fail'));

    await expect((service as any).findLiveMatches()).resolves.toEqual([]);
  });

  it('manual and force controls delegate to polling services', async () => {
    const checkSpy = jest
      .spyOn(service, 'checkAndUpdateLiveMatches')
      .mockResolvedValue(undefined);

    await service.triggerManualCheck();
    await service.forceStartPolling('55');
    service.forceStopPolling('55');

    expect(checkSpy).toHaveBeenCalled();
    expect(liveMatchServiceMock.startPolling).toHaveBeenCalledWith('55');
    expect(liveMatchServiceMock.stopPolling).toHaveBeenCalledWith('55');
  });

  it('returns scheduler status snapshot', () => {
    liveMatchServiceMock.getPolledMatches.mockReturnValue(['1', '2']);

    const result = service.getStatus();

    expect(result.currentlyPolling).toEqual(['1', '2']);
    expect(result.liveMatchWindowMinutes).toBe(120);
  });

  it('syncAllTeamFixtures exits in mock mode', async () => {
    configServiceMock.get.mockReturnValue(true);

    await service.syncAllTeamFixtures();

    expect(teamRepositoryMock.find).not.toHaveBeenCalled();
  });

  it('syncAllTeamFixtures exits when no syncable teams exist', async () => {
    configServiceMock.get.mockReturnValue(false);
    teamRepositoryMock.find.mockResolvedValue([{ id: 1, externalId: null }]);

    await service.syncAllTeamFixtures();

    expect(matchesServiceMock.syncFixturesFromApi).not.toHaveBeenCalled();
  });

  it('syncAllTeamFixtures syncs teams with external ids and continues on errors', async () => {
    configServiceMock.get.mockReturnValue(false);
    teamRepositoryMock.find.mockResolvedValue([
      { id: 1, name: 'A', externalId: 77 },
      { id: 2, name: 'B', externalId: 88 },
      { id: 3, name: 'C', externalId: null },
    ]);
    jest.spyOn<any, any>(service as any, 'sleep').mockResolvedValue(undefined);
    matchesServiceMock.syncFixturesFromApi
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('sync failed'));

    await service.syncAllTeamFixtures();

    expect(matchesServiceMock.syncFixturesFromApi).toHaveBeenCalledTimes(2);
    expect(matchesServiceMock.syncFixturesFromApi).toHaveBeenCalledWith(
      77,
      expect.objectContaining({ range: MatchRangeType.ALL }),
    );
    expect(matchesServiceMock.syncFixturesFromApi).toHaveBeenCalledWith(
      88,
      expect.objectContaining({ range: MatchRangeType.ALL }),
    );
  });

  it('triggerFullSync delegates to syncAllTeamFixtures', async () => {
    const syncSpy = jest
      .spyOn(service, 'syncAllTeamFixtures')
      .mockResolvedValue(undefined);

    await service.triggerFullSync();

    expect(syncSpy).toHaveBeenCalled();
  });
});