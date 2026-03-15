import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { BadgeService } from './badge.service';

describe('GamificationController', () => {
  let controller: GamificationController;
  let service: GamificationService;
  let badgeService: BadgeService;

  const mockUser = { sub: 1, email: 'test@test.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        {
          provide: GamificationService,
          useValue: {
            submitPrediction: jest.fn().mockResolvedValue({ id: 1 }),
            getLeaderboard: jest.fn().mockResolvedValue([]),
            rebuildLeaderboards: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: BadgeService,
          useValue: {
            checkAndAward: jest.fn().mockResolvedValue([]),
            getAllBadges: jest.fn().mockResolvedValue([]),
            getUserBadges: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
    service = module.get<GamificationService>(GamificationService);
    badgeService = module.get<BadgeService>(BadgeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit prediction', async () => {
    const body = { matchId: 1, homeScore: 2, awayScore: 1 };
    const result = await controller.predict(mockUser, body);
    expect(service.submitPrediction).toHaveBeenCalledWith(1, 1, 2, 1);
    expect(badgeService.checkAndAward).toHaveBeenCalledWith(1);
    expect(result.prediction).toBeDefined();
  });

  it('should get all badges', async () => {
    const result = await controller.getAllBadges(mockUser);
    expect(badgeService.getAllBadges).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
  });

  it('should get user badges', async () => {
    const result = await controller.getUserBadges('5');
    expect(badgeService.getUserBadges).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  it('should check badges', async () => {
    const result = await controller.checkBadges(mockUser);
    expect(badgeService.checkAndAward).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
  });

  it('should get leaderboard', async () => {
    await controller.getLeaderboard('weekly');
    expect(service.getLeaderboard).toHaveBeenCalledWith('weekly');
  });

  it('should rebuild leaderboard', async () => {
    await controller.rebuildLeaderboard();
    expect(service.rebuildLeaderboards).toHaveBeenCalled();
  });
});
