import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PlayersService } from './players.service';
import { Player } from './entities/player.entity';

describe('PlayersService', () => {
  let service: PlayersService;

  const createQb = () => ({
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
  });

  const repoMock = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getRepositoryToken(Player), useValue: repoMock },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    jest.clearAllMocks();
  });

  it('applies default filters and limit when no query options provided', async () => {
    const qb = createQb();
    repoMock.createQueryBuilder.mockReturnValue(qb);

    const result = await service.list({});

    expect(repoMock.createQueryBuilder).toHaveBeenCalledWith('p');
    expect(qb.where).toHaveBeenCalledWith('p.is_active = true');
    expect(qb.orderBy).toHaveBeenCalledWith('p.form', 'DESC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('p.price', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('normalizes filters and clamps custom limit', async () => {
    const qb = createQb();
    repoMock.createQueryBuilder.mockReturnValue(qb);

    await service.list({
      position: 'fw',
      search: '  Messi ',
      maxPrice: 9.5,
      limit: 999,
    });

    expect(qb.take).toHaveBeenCalledWith(200);
    expect(qb.andWhere).toHaveBeenCalledWith('p.position = :position', {
      position: 'FW',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('LOWER(p.name) LIKE :search', {
      search: '%messi%',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('p.price <= :maxPrice', {
      maxPrice: 9.5,
    });
  });

  it('enforces minimum limit and ignores invalid maxPrice/search', async () => {
    const qb = createQb();
    repoMock.createQueryBuilder.mockReturnValue(qb);

    await service.list({
      search: '   ',
      maxPrice: Number.NaN,
      limit: 0,
    });

    expect(qb.take).toHaveBeenCalledWith(1);
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'LOWER(p.name) LIKE :search',
      expect.anything(),
    );
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'p.price <= :maxPrice',
      expect.anything(),
    );
  });
});