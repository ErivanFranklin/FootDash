import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { LeagueService } from './league.service';
import { League } from './entities/league.entity';
import { FootballApiService } from '../football-api/football-api.service';

const mockLeagueRepo = () => ({
  create: jest.fn((dto: any) => dto),
  save: jest.fn().mockResolvedValue({ id: 1 }),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
});

const mockFootballApi = () => ({
  getLeagues: jest.fn().mockResolvedValue([]),
  getLeagueStandings: jest.fn().mockResolvedValue([]),
  getLeagueFixtures: jest.fn().mockResolvedValue([]),
});

describe('LeagueService', () => {
  let service: LeagueService;
  let leagueRepo: ReturnType<typeof mockLeagueRepo>;
  let footballApi: ReturnType<typeof mockFootballApi>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeagueService,
        { provide: getRepositoryToken(League), useFactory: mockLeagueRepo },
        { provide: FootballApiService, useFactory: mockFootballApi },
      ],
    }).compile();

    service = module.get<LeagueService>(LeagueService);
    leagueRepo = module.get(getRepositoryToken(League));
    footballApi = module.get(FootballApiService);
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all leagues ordered by isFeatured desc', async () => {
      const leagues = [
        { id: 1, name: 'Premier League', isFeatured: true },
        { id: 2, name: 'Minor Cup', isFeatured: false },
      ];
      leagueRepo.find.mockResolvedValue(leagues);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(leagueRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { isFeatured: 'DESC', name: 'ASC' },
      }));
    });
  });

  // ── findFeatured ──────────────────────────────────────────────────────────

  describe('findFeatured', () => {
    it('queries only leagues with isFeatured = true', async () => {
      await service.findFeatured();
      expect(leagueRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isFeatured: true } }),
      );
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns the league when it exists', async () => {
      const league = { id: 5, name: 'La Liga' };
      leagueRepo.findOne.mockResolvedValue(league);
      const result = await service.findById(5);
      expect(result).toEqual(league);
    });

    it('throws NotFoundException when league does not exist', async () => {
      leagueRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getStandings ──────────────────────────────────────────────────────────

  describe('getStandings', () => {
    it('calls footballApi.getLeagueStandings with correct externalId and season', async () => {
      leagueRepo.findOne.mockResolvedValue({ id: 1, externalId: 39, season: '2025' });
      footballApi.getLeagueStandings.mockResolvedValue([{ rank: 1, team: 'Arsenal' }]);

      await service.getStandings(1);
      expect(footballApi.getLeagueStandings).toHaveBeenCalledWith(39, 2025);
    });

    it('throws NotFoundException when league does not exist', async () => {
      leagueRepo.findOne.mockResolvedValue(null);
      await expect(service.getStandings(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── seedIfEmpty ───────────────────────────────────────────────────────────

  describe('seedIfEmpty', () => {
    it('calls syncLeagues when the table is empty', async () => {
      leagueRepo.count.mockResolvedValue(0);
      const syncSpy = jest.spyOn(service, 'syncLeagues').mockResolvedValue();

      await service.seedIfEmpty();
      expect(syncSpy).toHaveBeenCalled();
    });

    it('does NOT call syncLeagues when leagues already exist', async () => {
      leagueRepo.count.mockResolvedValue(7);
      const syncSpy = jest.spyOn(service, 'syncLeagues').mockResolvedValue();

      await service.seedIfEmpty();
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });
});
