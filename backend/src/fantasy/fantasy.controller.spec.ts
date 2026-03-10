import { Test, TestingModule } from '@nestjs/testing';
import { FantasyController } from './fantasy.controller';
import { FantasyLeagueService } from './fantasy-league.service';

describe('FantasyController', () => {
  let controller: FantasyController;
  const fantasyService = {
    createLeague: jest.fn().mockResolvedValue({ id: 1 }),
    joinLeague: jest.fn().mockResolvedValue({ id: 10 }),
    getMyLeagues: jest.fn().mockResolvedValue([]),
    getLeague: jest.fn().mockResolvedValue({ id: 1 }),
    getStandings: jest.fn().mockResolvedValue([]),
    getTeam: jest.fn().mockResolvedValue({ id: 1 }),
    getTransferMarket: jest.fn().mockResolvedValue({ options: [] }),
    setSquad: jest.fn().mockResolvedValue([]),
    makeTransfer: jest.fn().mockResolvedValue(undefined),
    getGameweekResults: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FantasyController],
      providers: [{ provide: FantasyLeagueService, useValue: fantasyService }],
    }).compile();

    controller = module.get<FantasyController>(FantasyController);
  });

  it('uses req.user.sub when creating a league', async () => {
    await controller.createLeague(
      { user: { sub: 33 } },
      { name: 'Test League', maxMembers: 20 },
    );

    expect(fantasyService.createLeague).toHaveBeenCalledWith(
      33,
      expect.objectContaining({ name: 'Test League' }),
    );
  });

  it('falls back to req.user.id when sub is not present', async () => {
    await controller.joinLeague(
      { user: { id: 44 } },
      { inviteCode: 'ABCDEFGH' },
    );

    expect(fantasyService.joinLeague).toHaveBeenCalledWith(44, 'ABCDEFGH');
  });
});
