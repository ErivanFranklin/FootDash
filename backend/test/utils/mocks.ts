import { FootballApiAdapter } from '../../src/football-api/football-api-adapter.interface';

export function createMockedFootballApi(): jest.Mocked<FootballApiAdapter> {
  return {
    getTeamInfo: jest.fn(),
    getTeamStats: jest.fn(),
    getTeamFixtures: jest.fn(),
    isMockMode: jest.fn(() => false),
  } as unknown as jest.Mocked<FootballApiAdapter>;
}

export const createMockRepo = () => {
  const qb = {
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  return {
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve({ id: 1, ...v })),
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn((opts) =>
      Promise.resolve({ id: opts.where.id, name: 'Saved' }),
    ),
    createQueryBuilder: jest.fn(() => qb),
  };
};
