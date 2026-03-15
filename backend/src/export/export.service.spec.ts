import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ExportService } from './export.service';
import { UserPrediction } from '../gamification/entities/user-prediction.entity';

describe('ExportService', () => {
  let service: ExportService;

  const repoMock = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: getRepositoryToken(UserPrediction), useValue: repoMock },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    jest.clearAllMocks();
  });

  it('maps prediction rows to export payload', async () => {
    repoMock.find.mockResolvedValue([
      {
        id: 1,
        matchId: 10,
        homeScore: 2,
        awayScore: 1,
        points: 3,
        createdAt: '2026-03-01',
        match: {
          homeTeam: { name: 'Arsenal' },
          awayTeam: { name: 'Chelsea' },
          homeScore: 2,
          awayScore: 1,
        },
      },
      {
        id: 2,
        matchId: 11,
        homeScore: 0,
        awayScore: 0,
        points: null,
        createdAt: '2026-03-02',
        match: null,
      },
    ]);

    const result = await service.getUserPredictions(5);

    expect(result[0].homeTeam).toBe('Arsenal');
    expect(result[1].homeTeam).toBe('Unknown');
    expect(result[1].actualHome).toBeNull();
  });

  it('computes user stats and accuracy', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '14' }),
    };
    repoMock.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4);
    repoMock.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getUserStats(9);

    expect(result.totalPredictions).toBe(20);
    expect(result.scoredPredictions).toBe(10);
    expect(result.exactPredictions).toBe(4);
    expect(result.totalPoints).toBe(14);
    expect(result.accuracy).toBe(50);
  });

  it('handles zero scored predictions in accuracy calculation', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: null }),
    };
    repoMock.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    repoMock.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getUserStats(9);

    expect(result.totalPoints).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('converts arrays to csv and escapes values', () => {
    const csv = service.toCsv([
      { a: 'x,y', b: 'normal', c: 'line\nvalue', d: '"quote"' },
    ]);

    expect(csv).toContain('a,b,c,d');
    expect(csv).toContain('"x,y"');
    expect(csv).toContain('"line\nvalue"');
    expect(csv).toContain('"""quote"""');
    expect(service.toCsv([])).toBe('');
  });
});
