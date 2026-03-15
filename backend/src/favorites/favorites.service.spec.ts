import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { FavoritesService } from './favorites.service';
import { Favorite, FavoriteEntityType } from './entities/favorite.entity';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const repoMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: getRepositoryToken(Favorite), useValue: repoMock },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  it('creates favorite when not already present', async () => {
    repoMock.findOne.mockResolvedValue(null);
    repoMock.create.mockReturnValue({
      userId: 1,
      entityType: FavoriteEntityType.TEAM,
      entityId: 10,
    });
    repoMock.save.mockResolvedValue({ id: 5 });

    await expect(
      service.addFavorite(1, FavoriteEntityType.TEAM, 10),
    ).resolves.toEqual({ id: 5 });
    expect(repoMock.findOne).toHaveBeenCalledWith({
      where: { userId: 1, entityType: FavoriteEntityType.TEAM, entityId: 10 },
    });
  });

  it('throws conflict when favorite already exists', async () => {
    repoMock.findOne.mockResolvedValue({ id: 5 });

    await expect(
      service.addFavorite(1, FavoriteEntityType.TEAM, 10),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes favorite by composite key', async () => {
    repoMock.delete.mockResolvedValue({});

    await expect(
      service.removeFavorite(2, FavoriteEntityType.MATCH, 9),
    ).resolves.toBeUndefined();
    expect(repoMock.delete).toHaveBeenCalledWith({
      userId: 2,
      entityType: FavoriteEntityType.MATCH,
      entityId: 9,
    });
  });

  it('gets user favorites with and without type filter', async () => {
    repoMock.find.mockResolvedValue([{ id: 1 }]);

    await service.getUserFavorites(3);
    await service.getUserFavorites(3, FavoriteEntityType.PLAYER);

    expect(repoMock.find).toHaveBeenNthCalledWith(1, {
      where: { userId: 3 },
      order: { createdAt: 'DESC' },
    });
    expect(repoMock.find).toHaveBeenNthCalledWith(2, {
      where: { userId: 3, entityType: FavoriteEntityType.PLAYER },
      order: { createdAt: 'DESC' },
    });
  });

  it('checks favorite existence by count', async () => {
    repoMock.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(
      service.isFavorite(1, FavoriteEntityType.TEAM, 77),
    ).resolves.toBe(true);
    await expect(
      service.isFavorite(1, FavoriteEntityType.TEAM, 78),
    ).resolves.toBe(false);
  });

  it('maps favorite team ids', async () => {
    repoMock.find.mockResolvedValue([{ entityId: 11 }, { entityId: 15 }]);

    await expect(service.getFavoriteTeamIds(7)).resolves.toEqual([11, 15]);
    expect(repoMock.find).toHaveBeenCalledWith({
      where: { userId: 7, entityType: FavoriteEntityType.TEAM },
      select: ['entityId'],
    });
  });
});
