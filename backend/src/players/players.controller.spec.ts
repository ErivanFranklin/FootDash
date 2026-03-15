import { Test, TestingModule } from '@nestjs/testing';

import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;

  const playersServiceMock = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [{ provide: PlayersService, useValue: playersServiceMock }],
    }).compile();

    controller = module.get<PlayersController>(PlayersController);
    jest.clearAllMocks();
  });

  it('maps query params and delegates to service', async () => {
    playersServiceMock.list.mockResolvedValue([{ id: 1 }]);

    const result = await controller.list('fw', 'haaland', '9.5', '25');

    expect(playersServiceMock.list).toHaveBeenCalledWith({
      position: 'fw',
      search: 'haaland',
      maxPrice: 9.5,
      limit: 25,
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('passes undefined for missing numeric query params', async () => {
    playersServiceMock.list.mockResolvedValue([]);

    await controller.list(undefined, undefined, undefined, undefined);

    expect(playersServiceMock.list).toHaveBeenCalledWith({
      position: undefined,
      search: undefined,
      maxPrice: undefined,
      limit: undefined,
    });
  });
});