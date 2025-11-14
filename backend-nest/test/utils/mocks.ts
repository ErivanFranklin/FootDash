import { FootballApiAdapter } from '../../../backend-nest/src/football-api/football-api-adapter.interface';

export function createMockedFootballApi(): jest.Mocked<FootballApiAdapter> {
  return {
    getTeamInfo: jest.fn(),
    getTeamStats: jest.fn(),
    getTeamFixtures: jest.fn(),
    isMockMode: jest.fn(() => false),
  } as unknown as jest.Mocked<FootballApiAdapter>;
}

export const createMockRepo = () => ({
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve({ id: 1, ...v })),
  findOne: jest.fn((opts) =>
    Promise.resolve({ id: opts.where.id, name: 'Saved' }),
  ),
});
