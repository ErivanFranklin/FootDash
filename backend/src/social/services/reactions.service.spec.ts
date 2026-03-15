import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReactionsService } from './reactions.service';
import { Reaction, ReactionTargetType, ReactionType } from '../entities/reaction.entity';
import { SocialGateway } from '../../websockets/social.gateway';

describe('ReactionsService', () => {
  let service: ReactionsService;

  const mockReactionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockGateway = {
    broadcastSocialEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: getRepositoryToken(Reaction), useValue: mockReactionRepository },
        { provide: SocialGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
    jest.clearAllMocks();
  });

  it('updates an existing reaction when user already reacted', async () => {
    const existing = {
      id: 1,
      userId: 2,
      targetType: ReactionTargetType.MATCH,
      targetId: 10,
      reactionType: ReactionType.LIKE,
    };

    mockReactionRepository.findOne.mockResolvedValue(existing);
    mockReactionRepository.save.mockImplementation(async (r: any) => r);

    const result = await service.addReaction(2, {
      targetType: ReactionTargetType.MATCH,
      targetId: 10,
      reactionType: ReactionType.LOVE,
    });

    expect(result.reactionType).toBe(ReactionType.LOVE);
    expect(mockGateway.broadcastSocialEvent).not.toHaveBeenCalled();
  });

  it('creates a new reaction and broadcasts for match target', async () => {
    const createdAt = new Date();
    const saved = {
      id: 22,
      userId: 1,
      targetType: ReactionTargetType.MATCH,
      targetId: 7,
      reactionType: ReactionType.WOW,
      createdAt,
    };

    mockReactionRepository.findOne.mockResolvedValue(null);
    mockReactionRepository.create.mockReturnValue(saved);
    mockReactionRepository.save.mockResolvedValue(saved);
    jest.spyOn(service, 'getReactionSummary').mockResolvedValue({
      like: 0,
      love: 0,
      laugh: 0,
      wow: 1,
      sad: 0,
      angry: 0,
      total: 1,
    });

    const result = await service.addReaction(1, {
      targetType: ReactionTargetType.MATCH,
      targetId: 7,
      reactionType: ReactionType.WOW,
    });

    expect(result).toEqual(saved);
    expect(mockGateway.broadcastSocialEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'reaction',
        targetType: 'match',
        targetId: 7,
      }),
    );
  });

  it('creates reaction and maps non-match targets to prediction channel', async () => {
    const saved = {
      id: 23,
      userId: 1,
      targetType: ReactionTargetType.COMMENT,
      targetId: 8,
      reactionType: ReactionType.LIKE,
      createdAt: new Date(),
    };
    mockReactionRepository.findOne.mockResolvedValue(null);
    mockReactionRepository.create.mockReturnValue(saved);
    mockReactionRepository.save.mockResolvedValue(saved);
    jest.spyOn(service, 'getReactionSummary').mockResolvedValue({
      like: 1,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: 1,
    });

    await service.addReaction(1, {
      targetType: ReactionTargetType.COMMENT,
      targetId: 8,
      reactionType: ReactionType.LIKE,
    });

    expect(mockGateway.broadcastSocialEvent).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: 'prediction' }),
    );
  });

  it('throws when trying to remove non-existing reaction', async () => {
    mockReactionRepository.findOne.mockResolvedValue(null);

    await expect(
      service.removeReaction(1, ReactionTargetType.MATCH, 3),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes reaction when found', async () => {
    const reaction = { id: 100 };
    mockReactionRepository.findOne.mockResolvedValue(reaction);

    const result = await service.removeReaction(1, ReactionTargetType.MATCH, 3);

    expect(result).toBe(true);
    expect(mockReactionRepository.remove).toHaveBeenCalledWith(reaction);
  });

  it('builds reaction summary with user reaction', async () => {
    jest.spyOn(service, 'getReactionsByTarget').mockResolvedValue([
      {
        userId: 10,
        reactionType: ReactionType.LIKE,
      } as any,
      {
        userId: 20,
        reactionType: ReactionType.LOVE,
      } as any,
      {
        userId: 10,
        reactionType: ReactionType.WOW,
      } as any,
    ]);

    const summary = await service.getReactionSummary(10, ReactionTargetType.MATCH, 1);

    expect(summary.total).toBe(3);
    expect(summary.like).toBe(1);
    expect(summary.love).toBe(1);
    expect(summary.wow).toBe(1);
    expect(summary.userReaction).toBe(ReactionType.WOW);
  });

  it('returns reaction counts from repository', async () => {
    mockReactionRepository.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

    const total = await service.getReactionCount(ReactionTargetType.MATCH, 10);
    const likes = await service.getReactionCountByType(
      ReactionTargetType.MATCH,
      10,
      ReactionType.LIKE,
    );

    expect(total).toBe(4);
    expect(likes).toBe(2);
  });

  it('maps reaction entity to response dto with fallback user name', () => {
    const createdAt = new Date();
    const dto = service.toResponseDto({
      id: 8,
      userId: 2,
      targetType: ReactionTargetType.MATCH,
      targetId: 11,
      reactionType: ReactionType.ANGRY,
      createdAt,
      user: undefined,
    } as any);

    expect(dto).toEqual({
      id: 8,
      userId: 2,
      userName: 'Unknown',
      targetType: ReactionTargetType.MATCH,
      targetId: 11,
      reactionType: ReactionType.ANGRY,
      createdAt: createdAt.toISOString(),
    });
  });
});
