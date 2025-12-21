import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsService } from './alerts.service';
import { Alert, AlertType } from '../entities/alert.entity';
import { User } from '../../users/user.entity';

describe('AlertsService', () => {
  let service: AlertsService;
  let alertRepository: Repository<Alert>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password_hash: 'hashed',
    createdAt: new Date(),
  } as User;

  const mockAlert: Alert = {
    id: 1,
    userId: 1,
    user: mockUser,
    alertType: AlertType.FOLLOWER,
    title: 'New Follower',
    message: 'User followed you',
    actionUrl: '/user/2',
    relatedUserId: 2,
    relatedUser: undefined,
    relatedEntityType: undefined,
    relatedEntityId: undefined,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAlertRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(Alert),
          useValue: mockAlertRepository,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    alertRepository = module.get<Repository<Alert>>(getRepositoryToken(Alert));

    jest.clearAllMocks();
    mockAlertRepository.findOne.mockResolvedValue(undefined);
  });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      const createAlertDto = {
        userId: 1,
        alertType: AlertType.FOLLOWER,
        title: 'New Follower',
        message: 'User followed you',
        actionUrl: '/user/2',
        relatedUserId: 2,
      };

      mockAlertRepository.create.mockReturnValue(mockAlert);
      mockAlertRepository.save.mockResolvedValue(mockAlert);

      const result = await service.createAlert(createAlertDto);

      expect(alertRepository.create).toHaveBeenCalledWith({
        userId: 1,
        alertType: AlertType.FOLLOWER,
        title: 'New Follower',
        message: 'User followed you',
        actionUrl: '/user/2',
        relatedUserId: 2,
        relatedEntityType: undefined,
        relatedEntityId: undefined,
        isRead: false,
      });
      expect(alertRepository.save).toHaveBeenCalledWith(mockAlert);
      expect(result).toEqual(mockAlert);
    });

    it('should create alert with optional fields', async () => {
      const createAlertDto = {
        userId: 1,
        alertType: AlertType.COMMENT,
        title: 'New Comment',
        message: 'Someone commented on your activity',
        relatedEntityType: 'activity',
        relatedEntityId: 123,
      };

      mockAlertRepository.create.mockReturnValue(mockAlert);
      mockAlertRepository.save.mockResolvedValue(mockAlert);

      await service.createAlert(createAlertDto);

      expect(alertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          alertType: AlertType.COMMENT,
          relatedEntityType: 'activity',
          relatedEntityId: 123,
          isRead: false,
        }),
      );
    });
  });

  describe('getUnreadAlerts', () => {
    it('should get unread alerts for a user', async () => {
      const alerts = [mockAlert, { ...mockAlert, id: 2 }];

      mockAlertRepository.find.mockResolvedValue(alerts);

      const result = await service.getUnreadAlerts(1);

      expect(alertRepository.find).toHaveBeenCalledWith({
        where: { userId: 1, isRead: false },
        order: { createdAt: 'DESC' },
        take: 20,
        relations: ['user', 'relatedUser'],
      });
      expect(result).toEqual(alerts);
    });

    it('should respect custom limit', async () => {
      mockAlertRepository.find.mockResolvedValue([mockAlert]);

      await service.getUnreadAlerts(1, 50);

      expect(alertRepository.find).toHaveBeenCalledWith({
        where: { userId: 1, isRead: false },
        order: { createdAt: 'DESC' },
        take: 50,
        relations: ['user', 'relatedUser'],
      });
    });

    it('should return empty array if no unread alerts', async () => {
      mockAlertRepository.find.mockResolvedValue([]);

      const result = await service.getUnreadAlerts(1);

      expect(result).toEqual([]);
    });
  });

  describe('getUserAlerts', () => {
    it('should get paginated alerts for a user', async () => {
      const alerts = [mockAlert];
      mockAlertRepository.findAndCount.mockResolvedValue([alerts, 1]);

      const result = await service.getUserAlerts(1);

      expect(alertRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
        relations: ['user', 'relatedUser'],
      });
      expect(result.alerts).toEqual(alerts);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should calculate correct pagination offset', async () => {
      mockAlertRepository.findAndCount.mockResolvedValue([[mockAlert], 50]);

      await service.getUserAlerts(1, 3, 20);

      expect(alertRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
    });

    it('should indicate if more alerts exist', async () => {
      mockAlertRepository.findAndCount.mockResolvedValue([[mockAlert], 100]);

      const result = await service.getUserAlerts(1, 1, 20);

      expect(result.hasMore).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark a single alert as read', async () => {
      const readAlert = { ...mockAlert, isRead: true };
      mockAlertRepository.update.mockResolvedValue({});
      mockAlertRepository.findOne.mockResolvedValue(readAlert);

      const result = await service.markAsRead(1);

      expect(alertRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { isRead: true },
      );
      expect(alertRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result?.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read for a user', async () => {
      await service.markAllAsRead(1);

      expect(alertRepository.update).toHaveBeenCalledWith(
        { userId: 1, isRead: false },
        { isRead: true },
      );
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert', async () => {
      await service.deleteAlert(1);

      expect(alertRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('deleteAlertForUser', () => {
    it('should delete alert when owned by user', async () => {
      mockAlertRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteAlertForUser(1, 1);

      expect(alertRepository.delete).toHaveBeenCalledWith({ id: 1, userId: 1 });
      expect(result).toBe(true);
    });

    it('should return false when alert not owned by user', async () => {
      mockAlertRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.deleteAlertForUser(1, 2);

      expect(alertRepository.delete).toHaveBeenCalledWith({ id: 1, userId: 2 });
      expect(result).toBe(false);
    });
  });

  describe('deleteOldAlerts', () => {
    it('should delete alerts older than 30 days', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      mockAlertRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.deleteOldAlerts(30);

      expect(alertRepository.createQueryBuilder).toHaveBeenCalledWith();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should delete alerts with custom days parameter', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      mockAlertRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.deleteOldAlerts(60);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });

  describe('getAlertCountByType', () => {
    it('should get alert count by type', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: AlertType.FOLLOWER, count: '5' },
          { type: AlertType.COMMENT, count: '3' },
        ]),
      };

      mockAlertRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAlertCountByType(1);

      expect(result[AlertType.FOLLOWER]).toBe(5);
      expect(result[AlertType.COMMENT]).toBe(3);
      expect(result[AlertType.REACTION]).toBe(0);
      expect(result[AlertType.MENTION]).toBe(0);
      expect(result[AlertType.SYSTEM]).toBe(0);
    });

    it('should return zero counts for alert types with no alerts', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockAlertRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAlertCountByType(1);

      Object.values(result).forEach((count) => {
        expect(count).toBe(0);
      });
    });
  });

  describe('createBulkAlerts', () => {
    it('should create multiple alerts at once', async () => {
      const dtos = [
        {
          userId: 1,
          alertType: AlertType.FOLLOWER,
          title: 'Follower 1',
          message: 'User followed you',
        },
        {
          userId: 2,
          alertType: AlertType.REACTION,
          title: 'Reaction',
          message: 'Someone reacted',
        },
      ];

      const alerts = dtos.map((dto, i) => ({
        ...mockAlert,
        id: i + 1,
        ...dto,
      }));
      mockAlertRepository.create.mockReturnValue(alerts);
      mockAlertRepository.save.mockResolvedValue(alerts);

      const result = await service.createBulkAlerts(dtos);

      expect(alertRepository.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining(dtos[0]),
          expect.objectContaining(dtos[1]),
        ]),
      );
      expect(alertRepository.save).toHaveBeenCalledWith(alerts);
      expect(result).toEqual(alerts);
    });

    it('should handle empty bulk alert array', async () => {
      mockAlertRepository.create.mockReturnValue([]);
      mockAlertRepository.save.mockResolvedValue([]);

      const result = await service.createBulkAlerts([]);

      expect(alertRepository.create).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('createMentionAlert', () => {
    it('creates a mention alert with context', async () => {
      const spy = jest.spyOn(service, 'createAlert');
      mockAlertRepository.create.mockImplementation((a) => a);
      mockAlertRepository.save.mockImplementation((a) =>
        Promise.resolve({ id: 1, ...a }),
      );

      const alert = await service.createMentionAlert({
        mentionedUserId: 5,
        authorUserId: 2,
        commentId: 42,
        snippet: 'Hi @user',
      });

      expect(spy).toHaveBeenCalled();
      expect(alert.userId).toBe(5);
      expect(alert.alertType).toBe(AlertType.MENTION);
      expect(alert.relatedEntityType).toBe('comment');
      expect(alert.relatedEntityId).toBe(42);
      expect(alert.relatedUserId).toBe(2);
    });

    it('returns existing alert when duplicate mention detected', async () => {
      const existing = {
        id: 99,
        userId: 5,
        alertType: AlertType.MENTION,
      } as any;
      mockAlertRepository.findOne.mockResolvedValue(existing);

      const alert = await service.createMentionAlert({
        mentionedUserId: 5,
        authorUserId: 2,
        commentId: 42,
      });

      expect(alertRepository.findOne).toHaveBeenCalled();
      expect(alertRepository.save).not.toHaveBeenCalled();
      expect(alert).toBe(existing);
    });
  });
});
