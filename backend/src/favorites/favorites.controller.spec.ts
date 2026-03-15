import { Test, TestingModule } from '@nestjs/testing';

import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;

  const favoritesServiceMock = {
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    getUserFavorites: jest.fn(),
    isFavorite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: favoritesServiceMock }],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    jest.clearAllMocks();
  });

  it('adds favorite for current user', async () => {
    favoritesServiceMock.addFavorite.mockResolvedValue({ id: 1 });

    await expect(
      controller.addFavorite(
        { sub: 5 },
        { entityType: 'team' as any, entityId: 10 },
      ),
    ).resolves.toEqual({ id: 1 });

    expect(favoritesServiceMock.addFavorite).toHaveBeenCalledWith(5, 'team', 10);
  });

  it('removes favorite and returns success wrapper', async () => {
    favoritesServiceMock.removeFavorite.mockResolvedValue(undefined);

    await expect(
      controller.removeFavorite({ sub: 5 }, 'match' as any, 7),
    ).resolves.toEqual({ success: true });
  });

  it('gets user favorites with optional type filter', async () => {
    favoritesServiceMock.getUserFavorites.mockResolvedValue([{ id: 9 }]);

    await expect(controller.getUserFavorites({ sub: 5 }, 'team' as any)).resolves.toEqual([
      { id: 9 },
    ]);
    expect(favoritesServiceMock.getUserFavorites).toHaveBeenCalledWith(5, 'team');
  });

  it('returns favorite check payload', async () => {
    favoritesServiceMock.isFavorite.mockResolvedValue(true);

    await expect(
      controller.isFavorite({ sub: 5 }, 'team' as any, 10),
    ).resolves.toEqual({ isFavorite: true });
  });
});
