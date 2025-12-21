import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';
import { SocialGateway } from '../../websockets/social.gateway';
import { AlertsService } from './alerts.service';
import { UserProfileService } from '../../users/services/user-profile.service';

describe('CommentsService mentions', () => {
  let service: CommentsService;
  let repo: Repository<Comment>;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
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
});
