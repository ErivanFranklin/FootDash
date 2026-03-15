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
    it('uses QueryBuilder to search for keywords in title/homeTeam/awayTeam', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 10, title: 'Barca vs Real' }]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockQB);

      const result = await service.search('Barca');
      expect(result).toHaveLength(1);
      expect(repo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQB.where).toHaveBeenCalledWith(
        expect.stringContaining('LOWER'),
        expect.objectContaining({ q: '%barca%' }),
      );
    });
  });

  // ── syncHighlights ────────────────────────────────────────────────────────

  describe('syncHighlights', () => {
    it('seeds mock data if YOUTUBE_API_KEY is missing and DB is empty', async () => {
      (repo.count as jest.Mock).mockResolvedValue(0);
      (repo.save as jest.Mock).mockResolvedValue({});
      (repo.create as jest.Mock).mockImplementation((a) => a);

      await service.syncHighlights();

      expect(repo.count).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('does nothing if YOUTUBE_API_KEY missing but DB is already seeded', async () => {
      (repo.count as jest.Mock).mockResolvedValue(10);

      await service.syncHighlights();

      expect(repo.count).toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('ignores sync error and logs it if fetch fails in API mode', async () => {
      // Setup API mode by overriding useMock logic
      (service as any).useMock = false;
      const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();
      
      const { throwError } = require('rxjs');
      const http = (service as any).http;
      jest.spyOn(http, 'get').mockReturnValue(throwError(() => new Error('YT fail')));

      await service.syncHighlights();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to sync highlights',
        'YT fail',
      );
    });
  });
});
