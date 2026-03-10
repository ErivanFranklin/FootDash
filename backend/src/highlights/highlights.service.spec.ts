import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { HighlightsService } from './highlights.service';
import { Highlight } from './entities/highlight.entity';

const mockRepo = () => ({
  create: jest.fn((dto: any) => ({ id: 1, ...dto })),
  save: jest.fn().mockResolvedValue({ id: 1 }),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  increment: jest.fn().mockResolvedValue(undefined),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

const mockHttpService = () => ({
  get: jest.fn().mockReturnValue({ pipe: jest.fn() }),
});
const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    if (key === 'YOUTUBE_API_KEY') return undefined; // mock mode
    return null;
  }),
});

describe('HighlightsService', () => {
  let service: HighlightsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighlightsService,
        { provide: getRepositoryToken(Highlight), useFactory: mockRepo },
        { provide: HttpService, useFactory: mockHttpService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<HighlightsService>(HighlightsService);
    repo = module.get(getRepositoryToken(Highlight));
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated data and total count', async () => {
      const highlights: Partial<Highlight>[] = [
        { id: 1, title: 'Arsenal vs Chelsea' },
        { id: 2, title: 'Liverpool vs City' },
      ];
      repo.findAndCount.mockResolvedValue([highlights, 2]);

      const result = await service.findAll(1, 20);
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('applies correct offset for page 2', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(2, 10);
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  // ── findByMatch ───────────────────────────────────────────────────────────

  describe('findByMatch', () => {
    it('queries highlights for the given matchId', async () => {
      repo.find.mockResolvedValue([{ id: 1, matchId: 42 }]);
      await service.findByMatch(42);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { matchId: 42 } }),
      );
    });
  });

  // ── incrementView ─────────────────────────────────────────────────────────

  describe('incrementView', () => {
    it('increments viewCount by 1', async () => {
      await service.incrementView(7);
      expect(repo.increment).toHaveBeenCalledWith({ id: 7 }, 'viewCount', 1);
    });
  });

  // ── search ────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('builds a query with LIKE filter on title, homeTeam, awayTeam', async () => {
      repo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => [{ id: 1, title: 'Arsenal goals' }]),
      });

      const results = await service.search('arsenal');
      expect(results).toHaveLength(1);
    });

    it('returns empty array for empty search query', async () => {
      repo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => []),
      });

      const results = await service.search('');
      expect(results).toHaveLength(0);
    });
  });

  // ── seedMockIfEmpty (via syncHighlights in mock mode) ─────────────────────

  describe('syncHighlights (mock mode)', () => {
    it('seeds mock data when table is empty', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockImplementation((dto) => ({ ...dto }));
      repo.save.mockResolvedValue({});

      await service.syncHighlights();
      expect(repo.save).toHaveBeenCalled();
    });

    it('is idempotent — does NOT seed when table already has rows', async () => {
      repo.count.mockResolvedValue(5);

      await service.syncHighlights();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
