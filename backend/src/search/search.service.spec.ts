import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { Team } from '../teams/entities/team.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Match } from '../matches/entities/match.entity';
import { SearchType } from './dto/search-query.dto';

describe('SearchService', () => {
  let service: SearchService;

  const makeQb = () => ({
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  });

  const teamQb = makeQb();
  const profileQb = makeQb();
  const matchQb = makeQb();

  const mockTeamRepo = {
    createQueryBuilder: jest.fn(() => teamQb),
  };

  const mockProfileRepo = {
    createQueryBuilder: jest.fn(() => profileQb),
  };

  const mockMatchRepo = {
    createQueryBuilder: jest.fn(() => matchQb),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Team), useValue: mockTeamRepo },
        { provide: getRepositoryToken(UserProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(Match), useValue: mockMatchRepo },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  it('searches all sources, merges by score, and paginates', async () => {
    teamQb.getManyAndCount.mockResolvedValue([
      [{ id: 1, name: 'Arsenal', shortCode: 'ARS' }],
      1,
    ]);
    profileQb.getManyAndCount.mockResolvedValue([
      [
        {
          id: 2,
          displayName: 'Arsenal Fan',
          bio: 'bio',
          avatarUrl: null,
          user: { id: 12 },
        },
      ],
      1,
    ]);
    matchQb.getManyAndCount.mockResolvedValue([
      [
        {
          id: 3,
          homeTeam: { name: 'Arsenal' },
          awayTeam: { name: 'Chelsea' },
          homeScore: 1,
          awayScore: 0,
          kickOff: new Date('2026-03-01').toISOString(),
          status: 'FT',
        },
      ],
      1,
    ]);

    const result = await service.search({
      q: 'Arsenal',
      type: SearchType.ALL,
      page: 1,
      limit: 10,
    } as any);

    expect(result.total).toBe(3);
    expect(result.results.length).toBe(3);
    expect(result.results[0].title).toBe('Arsenal');
    expect(result.type).toBe(SearchType.ALL);
  });

  it('searches only teams when type=teams', async () => {
    teamQb.getManyAndCount.mockResolvedValue([
      [{ id: 11, name: 'Inter', shortCode: 'INT' }],
      1,
    ]);

    const result = await service.search({
      q: 'Inter',
      type: SearchType.TEAMS,
      page: 1,
      limit: 20,
    } as any);

    expect(result.total).toBe(1);
    expect(result.results[0].type).toBe('team');
    expect(mockProfileRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(mockMatchRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('searches only users when type=users', async () => {
    profileQb.getManyAndCount.mockResolvedValue([
      [
        {
          id: 10,
          displayName: 'Maria',
          bio: null,
          avatarUrl: null,
          user: { id: 50 },
        },
      ],
      1,
    ]);

    const result = await service.search({
      q: 'Maria',
      type: SearchType.USERS,
      page: 2,
      limit: 5,
    } as any);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.results[0].type).toBe('user');
    expect(result.results[0].url).toBe('/user-profile/50');
  });

  it('searches only matches when type=matches', async () => {
    matchQb.getManyAndCount.mockResolvedValue([
      [
        {
          id: 21,
          homeTeam: { name: 'PSG' },
          awayTeam: { name: 'Lyon' },
          homeScore: null,
          awayScore: null,
          kickOff: null,
          status: 'Scheduled',
          referee: null,
        },
      ],
      1,
    ]);

    const result = await service.search({
      q: 'PSG',
      type: SearchType.MATCHES,
      page: 1,
      limit: 5,
    } as any);

    expect(result.total).toBe(1);
    expect(result.results[0].type).toBe('match');
    expect(result.results[0].subtitle).toContain('Scheduled');
  });

  it('returns empty team results on team query failure', async () => {
    teamQb.getManyAndCount.mockRejectedValue(new Error('team db fail'));

    const result = await service.search({
      q: 'x',
      type: SearchType.TEAMS,
      page: 1,
      limit: 10,
    } as any);

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns empty user results on user query failure', async () => {
    profileQb.getManyAndCount.mockRejectedValue(new Error('user db fail'));

    const result = await service.search({
      q: 'x',
      type: SearchType.USERS,
      page: 1,
      limit: 10,
    } as any);

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns empty match results on match query failure', async () => {
    matchQb.getManyAndCount.mockRejectedValue(new Error('match db fail'));

    const result = await service.search({
      q: 'x',
      type: SearchType.MATCHES,
      page: 1,
      limit: 10,
    } as any);

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns baseline score tiers from scoreMatch helper', () => {
    const anyService = service as any;

    expect(anyService.scoreMatch('Arsenal', '%arsenal%')).toBe(100);
    expect(anyService.scoreMatch('Arsenal FC', '%ars%')).toBe(80);
    expect(anyService.scoreMatch('FC Arsenal Club', '%arsenal%')).toBe(60);
    expect(anyService.scoreMatch('Chelsea', '%arsenal%')).toBe(40);
  });

  describe('Search pagination edge cases', () => {
    it('paginates merged results across different pages', async () => {
      // 3 items per source, limit 2
      teamQb.getManyAndCount.mockResolvedValue([
        [
          { id: 1, name: 'A1', shortCode: 'A1' },
          { id: 2, name: 'A2', shortCode: 'A2' },
        ],
        10,
      ]);
      profileQb.getManyAndCount.mockResolvedValue([
        [
          { id: 3, displayName: 'B1' },
          { id: 4, displayName: 'B2' },
        ],
        10,
      ]);
      matchQb.getManyAndCount.mockResolvedValue([
        [
          { id: 5, homeTeam: { name: 'C1' }, awayTeam: { name: 'C2' } },
          { id: 6, homeTeam: { name: 'D1' }, awayTeam: { name: 'D2' } },
        ],
        10,
      ]);

      const result = await service.search({
        q: 'query',
        type: SearchType.ALL,
        page: 2,
        limit: 2,
      } as any);

      expect(result.results.length).toBe(2);
      expect(result.page).toBe(2);
      expect(result.total).toBe(30);
    });
  });

  describe('Mapping edge cases', () => {
    it('handles matches with missing team names during mapping', async () => {
      matchQb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 1,
            homeTeam: null,
            awayTeam: null,
            homeScore: null,
            awayScore: null,
            status: 'TBD',
            kickOff: null,
          },
        ],
        1,
      ]);

      const result = await service.search({
        q: 'x',
        type: SearchType.MATCHES,
        page: 1,
        limit: 10,
      } as any);

      expect(result.results[0].title).toBe('TBD vs TBD');
      expect(result.results[0].subtitle).toBe('TBD · TBD');
    });

    it('handles user profiles without user entity', async () => {
      profileQb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 99,
            displayName: null,
            bio: null,
            avatarUrl: null,
            user: null,
          },
        ],
        1,
      ]);

      const result = await service.search({
        q: 'x',
        type: SearchType.USERS,
        page: 1,
        limit: 10,
      } as any);

      expect(result.results[0].title).toBe('User');
      expect(result.results[0].id).toBe(99);
      expect(result.results[0].url).toBe('/user-profile/99');
    });
  });
});
