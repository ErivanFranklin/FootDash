import { BadRequestException, StreamableFile } from '@nestjs/common';

import { DataExportController } from './data-export.controller';

describe('DataExportController', () => {
  const createQb = () => ({
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  });

  const exportServiceMock = {
    exportTrainingData: jest.fn(),
    convertToCSV: jest.fn(),
    matchRepository: {
      createQueryBuilder: jest.fn(),
    },
  } as any;

  const controller = new DataExportController(exportServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates date range and minMatches for exportTrainingData', async () => {
    await expect(
      controller.exportTrainingData({
        startDate: '2026-02-01',
        endDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.exportTrainingData({
        minMatchesPerTeam: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps defaults and delegates exportTrainingData', async () => {
    exportServiceMock.exportTrainingData.mockResolvedValue({ data: [], metadata: {} });

    await controller.exportTrainingData({ format: 'json' });

    expect(exportServiceMock.exportTrainingData).toHaveBeenCalledWith(
      expect.objectContaining({
        minMatchesPerTeam: 5,
        includeOngoing: false,
        format: 'json',
      }),
    );
  });

  it('returns CSV stream for exportTrainingDataCSV', async () => {
    exportServiceMock.exportTrainingData.mockResolvedValue({
      data: [{ a: 1 }],
      metadata: {},
    });
    exportServiceMock.convertToCSV.mockReturnValue('a\n1');

    const file = await controller.exportTrainingDataCSV(
      ['2025'],
      [39],
      false,
      undefined,
      undefined,
      2,
    );

    expect(exportServiceMock.convertToCSV).toHaveBeenCalledWith([{ a: 1 }]);
    expect(file).toBeInstanceOf(StreamableFile);
  });

  it('returns sample data and total feature count', async () => {
    exportServiceMock.exportTrainingData.mockResolvedValue({
      data: [{ a: 1 }, { a: 2 }, { a: 3 }],
      metadata: { total: 3 },
    });

    const result = await controller.getSampleTrainingData();

    expect(result.sample_data.length).toBe(3);
    expect(result.total_features).toBe(1);
  });

  it('maps export stats from repository queries', async () => {
    const statsQb = createQb();
    statsQb.getRawOne.mockResolvedValue({
      total_matches: '17',
      earliest_date: '2024-01-01',
      latest_date: '2026-01-01',
    });

    const seasonsQb = createQb();
    seasonsQb.getRawMany.mockResolvedValue([{ season: '2025' }, { season: '2024' }]);

    const leaguesQb = createQb();
    leaguesQb.getRawMany.mockResolvedValue([{ league_id: '39' }, { league_id: '140' }]);

    exportServiceMock.matchRepository.createQueryBuilder
      .mockReturnValueOnce(statsQb)
      .mockReturnValueOnce(seasonsQb)
      .mockReturnValueOnce(leaguesQb);

    const result = await controller.getExportStats(3);

    expect(result.total_finished_matches).toBe(17);
    expect(result.available_seasons).toEqual(['2025', '2024']);
    expect(result.available_leagues).toEqual([39, 140]);
    expect(result.min_matches_threshold).toBe(3);
  });
});