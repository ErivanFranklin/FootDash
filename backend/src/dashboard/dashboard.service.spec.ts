import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DashboardService } from './dashboard.service';
import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { FavoritesService } from '../favorites/favorites.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const createQb = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  });

  const matchRepoMock = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };
  const teamRepoMock = {
    find: jest.fn(),
  };
  const favoritesServiceMock = {
    getFavoriteTeamIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Match), useValue: matchRepoMock },
        { provide: getRepositoryToken(Team), useValue: teamRepoMock },
        { provide: FavoritesService, useValue: favoritesServiceMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('returns fallback dashboard for users with no favorites', async () => {
    favoritesServiceMock.getFavoriteTeamIds.mockResolvedValue([]);
    matchRepoMock.find.mockResolvedValue([{ id: 1 }]);

    const result = await service.getPersonalizedDashboard(10);

    expect(result.favoriteTeams).toEqual([]);
    expect(result.recentResults).toEqual([]);
    expect(result.upcomingMatches).toEqual([]);
    expect(result.allRecentMatches).toEqual([{ id: 1 }]);
    expect(result.hasFavorites).toBe(false);
    expect(teamRepoMock.find).not.toHaveBeenCalled();
  });

  it('loads favorite teams and match segments when favorites exist', async () => {
    const recentQb = createQb();
    const upcomingQb = createQb();
    recentQb.getMany.mockResolvedValue([{ id: 2 }]);
    upcomingQb.getMany.mockResolvedValue([{ id: 3 }]);

    favoritesServiceMock.getFavoriteTeamIds.mockResolvedValue([4, 5]);
    teamRepoMock.find.mockResolvedValue([{ id: 4 }, { id: 5 }]);
    matchRepoMock.createQueryBuilder
      .mockReturnValueOnce(recentQb)
      .mockReturnValueOnce(upcomingQb);
    matchRepoMock.find.mockResolvedValue([{ id: 99 }]);

    const result = await service.getPersonalizedDashboard(11);

    expect(teamRepoMock.find).toHaveBeenCalled();
    expect(recentQb.where).toHaveBeenCalled();
    expect(upcomingQb.where).toHaveBeenCalled();
    expect(result.favoriteTeams).toEqual([{ id: 4 }, { id: 5 }]);
    expect(result.recentResults).toEqual([{ id: 2 }]);
    expect(result.upcomingMatches).toEqual([{ id: 3 }]);
    expect(result.hasFavorites).toBe(true);
  });
});
