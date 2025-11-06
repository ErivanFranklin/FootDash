import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchRangeType } from './dto/matches-query.dto';

const matchesServiceMock = {
  getTeamMatches: jest.fn(),
};

describe('MatchesController', () => {
  let controller: MatchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [{ provide: MatchesService, useValue: matchesServiceMock }],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
    jest.clearAllMocks();
  });

  it('delegates to MatchesService with validated params', async () => {
    matchesServiceMock.getTeamMatches.mockResolvedValue('payload');

    const result = await controller.getMatchesForTeam(
      { teamId: 33 },
      { range: MatchRangeType.RECENT, limit: 2 },
    );

    expect(matchesServiceMock.getTeamMatches).toHaveBeenCalledWith(33, {
      range: MatchRangeType.RECENT,
      limit: 2,
    });
    expect(result).toBe('payload');
  });
});
