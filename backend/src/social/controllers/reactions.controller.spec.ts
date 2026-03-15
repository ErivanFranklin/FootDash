import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from '../services/reactions.service';
import { ReactionTargetType, ReactionType } from '../entities/reaction.entity';

describe('ReactionsController', () => {
  let controller: ReactionsController;

  const mockReactionsService = {
    addReaction: jest.fn(),
    toResponseDto: jest.fn(),
    removeReaction: jest.fn(),
    getReactionSummary: jest.fn(),
    getReactionsByTarget: jest.fn(),
    getUserReaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
      providers: [
        { provide: ReactionsService, useValue: mockReactionsService },
      ],
    }).compile();

    controller = module.get<ReactionsController>(ReactionsController);
    jest.clearAllMocks();
  });

  it('adds reaction and returns mapped dto', async () => {
    mockReactionsService.addReaction.mockResolvedValue({ id: 1 });
    mockReactionsService.toResponseDto.mockReturnValue({ id: 1, reactionType: 'like' });

    const dto = {
      targetType: ReactionTargetType.MATCH,
      targetId: 22,
      reactionType: ReactionType.LIKE,
    };

    const result = await controller.addReaction({ user: { sub: 10 } } as any, dto as any);

    expect(mockReactionsService.addReaction).toHaveBeenCalledWith(10, dto);
    expect(result.success).toBe(true);
  });

  it('removes reaction using parsed params', async () => {
    const result = await controller.removeReaction(
      { user: { sub: 4 } } as any,
      'match',
      '30',
    );

    expect(mockReactionsService.removeReaction).toHaveBeenCalledWith(
      4,
      'match',
      30,
    );
    expect(result.success).toBe(true);
  });

  it('returns summary with current user when present', async () => {
    mockReactionsService.getReactionSummary.mockResolvedValue({ total: 3 });

    const result = await controller.getReactionSummary(
      { user: { sub: 15 } } as any,
      'match',
      '7',
    );

    expect(mockReactionsService.getReactionSummary).toHaveBeenCalledWith(
      15,
      'match',
      7,
    );
    expect(result).toEqual({ success: true, summary: { total: 3 } });
  });

  it('returns summary with null user when unauthenticated context', async () => {
    mockReactionsService.getReactionSummary.mockResolvedValue({ total: 0 });

    await controller.getReactionSummary({} as any, 'prediction', '7');

    expect(mockReactionsService.getReactionSummary).toHaveBeenCalledWith(
      null,
      'prediction',
      7,
    );
  });

  it('returns mapped reaction list', async () => {
    mockReactionsService.getReactionsByTarget.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockReactionsService.toResponseDto.mockImplementation((r: any) => ({ id: r.id }));

    const result = await controller.getReactionsList('match', '8');

    expect(mockReactionsService.getReactionsByTarget).toHaveBeenCalledWith('match', 8);
    expect(result.reactions).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns null when user has no reaction', async () => {
    mockReactionsService.getUserReaction.mockResolvedValue(null);

    const result = await controller.getUserReaction(
      { user: { sub: 3 } } as any,
      'match',
      '8',
    );

    expect(result).toEqual({ success: true, reaction: null });
  });

  it('returns mapped user reaction when found', async () => {
    mockReactionsService.getUserReaction.mockResolvedValue({ id: 5 });
    mockReactionsService.toResponseDto.mockReturnValue({ id: 5, reactionType: 'wow' });

    const result = await controller.getUserReaction(
      { user: { sub: 3 } } as any,
      'match',
      '8',
    );

    expect(result).toEqual({
      success: true,
      reaction: { id: 5, reactionType: 'wow' },
    });
  });
});
