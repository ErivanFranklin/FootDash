import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';
import { SocialGateway } from '../../websockets/social.gateway';
import { AlertsService } from './alerts.service';
import { UserProfileService } from '../../users/services/user-profile.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let repo: Repository<Comment>;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  } as unknown as Repository<Comment>;

  const mockGateway = {
    broadcastSocialEvent: jest.fn(),
  } as unknown as SocialGateway;

  const mockAlerts = {
    createMentionAlert: jest.fn(),
  } as unknown as AlertsService;

  const mockProfiles = {
    findUserIdsByDisplayNames: jest.fn(),
    getDisplayNameFallback: jest.fn(),
  } as unknown as UserProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: mockRepo },
        { provide: SocialGateway, useValue: mockGateway },
        { provide: AlertsService, useValue: mockAlerts },
        { provide: UserProfileService, useValue: mockProfiles },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    repo = module.get(getRepositoryToken(Comment));
    jest.clearAllMocks();
    (repo.count as any).mockResolvedValue(0);
    (mockProfiles.getDisplayNameFallback as any).mockResolvedValue('user');
  });

  it('rejects comments without a target association', async () => {
    await expect(
      service.createComment(1, {
        content: 'orphaned comment',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects replies when parent comment does not exist', async () => {
    (repo.findOne as any).mockResolvedValue(null);

    await expect(
      service.createComment(1, {
        content: 'reply',
        parentCommentId: 404,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates mention alerts for resolved display names', async () => {
    (repo.findOne as any).mockResolvedValue({ id: 10, isDeleted: false });
    (repo.create as any).mockReturnValue({ id: 1 });
    (repo.save as any).mockResolvedValue({
      id: 1,
      content: 'Hi @alice and @bob',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    });
    (mockProfiles.findUserIdsByDisplayNames as any).mockResolvedValue(
      new Map([
        ['alice', 2],
        ['bob', 3],
      ]),
    );

    await service.createComment(1, {
      content: 'Hi @alice and @bob',
      matchId: 5,
    } as any);

    expect(mockAlerts.createMentionAlert).toHaveBeenCalledTimes(2);
    expect(mockAlerts.createMentionAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        mentionedUserId: 2,
        authorUserId: 1,
        commentId: 1,
      }),
    );
    expect(mockAlerts.createMentionAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        mentionedUserId: 3,
        authorUserId: 1,
        commentId: 1,
      }),
    );
  });

  it('does not alert author mentioning themselves', async () => {
    (repo.findOne as any).mockResolvedValue({ id: 10, isDeleted: false });
    (repo.create as any).mockReturnValue({ id: 2 });
    (repo.save as any).mockResolvedValue({
      id: 2,
      content: 'I am @me',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    });
    (mockProfiles.findUserIdsByDisplayNames as any).mockResolvedValue(
      new Map([['me', 1]]),
    );

    await service.createComment(1, {
      content: 'I am @me',
      predictionId: 9,
    } as any);
    expect(mockAlerts.createMentionAlert).not.toHaveBeenCalled();
  });

  it('does not broadcast when comment is only a reply target', async () => {
    (repo.findOne as any).mockResolvedValue({ id: 10, isDeleted: false });
    (repo.create as any).mockReturnValue({ id: 3 });
    (repo.save as any).mockResolvedValue({
      id: 3,
      userId: 1,
      parentCommentId: 10,
      content: 'reply only',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    });
    (mockProfiles.findUserIdsByDisplayNames as any).mockResolvedValue(new Map());

    await service.createComment(1, {
      content: 'reply only',
      parentCommentId: 10,
    } as any);

    expect(mockGateway.broadcastSocialEvent).not.toHaveBeenCalled();
  });

  it('returns paginated match comments', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-01T01:00:00.000Z');
    (repo.findAndCount as any).mockResolvedValue([
      [
        {
          id: 11,
          userId: 7,
          matchId: 9,
          content: 'match comment',
          createdAt,
          updatedAt,
          isDeleted: false,
          user: { email: 'match@example.com' },
        },
      ],
      3,
    ]);
    (repo.count as any)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2);
    (mockProfiles.getDisplayNameFallback as any).mockResolvedValue('match-user');

    const result = await service.getCommentsByMatch(9, { page: 1, limit: 1 });

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          matchId: 9,
          isDeleted: false,
        }),
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 1,
      }),
    );
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(true);
    expect(result.comments[0]).toEqual(
      expect.objectContaining({
        id: 11,
        userName: 'match-user',
        replyCount: 2,
      }),
    );
  });

  it('returns paginated prediction replies in ascending order', async () => {
    const createdAt = new Date('2026-01-02T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T01:00:00.000Z');
    (repo.findAndCount as any).mockResolvedValue([
      [
        {
          id: 21,
          userId: 4,
          parentCommentId: 12,
          content: 'reply',
          createdAt,
          updatedAt,
          isDeleted: false,
          user: { email: 'reply@example.com' },
        },
      ],
      1,
    ]);
    (repo.count as any).mockResolvedValue(0);
    (mockProfiles.getDisplayNameFallback as any).mockResolvedValue('reply-user');

    const result = await service.getReplies(12, { page: 2, limit: 5 });

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentCommentId: 12, isDeleted: false },
        order: { createdAt: 'ASC' },
        skip: 5,
        take: 5,
      }),
    );
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.hasMore).toBe(false);
  });

  it('updates an owned comment', async () => {
    const comment = { id: 33, userId: 5, content: 'old', isDeleted: false };
    (repo.findOne as any).mockResolvedValue(comment);
    (repo.save as any).mockImplementation(async (entity: any) => entity);

    const result = await service.updateComment(33, 5, { content: 'new text' });

    expect(result.content).toBe('new text');
    expect(repo.save).toHaveBeenCalledWith(comment);
  });

  it('rejects updates for missing comments', async () => {
    (repo.findOne as any).mockResolvedValue(null);

    await expect(
      service.updateComment(33, 5, { content: 'new text' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects updates for comments owned by another user', async () => {
    (repo.findOne as any).mockResolvedValue({
      id: 33,
      userId: 8,
      content: 'old',
      isDeleted: false,
    });

    await expect(
      service.updateComment(33, 5, { content: 'new text' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft deletes an owned comment', async () => {
    const comment = { id: 40, userId: 5, isDeleted: false, deletedAt: null };
    (repo.findOne as any).mockResolvedValue(comment);
    (repo.save as any).mockImplementation(async (entity: any) => entity);

    await expect(service.deleteComment(40, 5)).resolves.toBe(true);
    expect(comment.isDeleted).toBe(true);
    expect(comment.deletedAt).toBeInstanceOf(Date);
  });

  it('counts top-level comments by target type', async () => {
    (repo.count as any).mockResolvedValue(6);

    await expect(service.getCommentCount('match', 9)).resolves.toBe(6);
    expect(repo.count).toHaveBeenCalledWith({
      where: { isDeleted: false, parentCommentId: null, matchId: 9 },
    });

    await expect(service.getCommentCount('prediction', 7)).resolves.toBe(6);
    expect(repo.count).toHaveBeenCalledWith({
      where: { isDeleted: false, parentCommentId: null, predictionId: 7 },
    });
  });
});
