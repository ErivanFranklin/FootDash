import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from '../services/alerts.service';
import { Alert, AlertType } from '../entities/alert.entity';
import { User } from '../../users/user.entity';

describe('AlertsController', () => {
  let controller: AlertsController;
  let service: AlertsService;

  const mockAlert: Alert = {
    id: 1,
    userId: 1,
    user: {} as User,
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

  const mockAlertsService = {
    createAlert: jest.fn(),
    getUnreadAlerts: jest.fn(),
    getUserAlerts: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteAlertForUser: jest.fn(),
    getAlertCountByType: jest.fn(),
    createBulkAlerts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [
        {
          provide: AlertsService,
          useValue: mockAlertsService,
        },
      ],
    }).compile();

    controller = module.get<AlertsController>(AlertsController);
    service = module.get<AlertsService>(AlertsService);

    jest.clearAllMocks();
  });

  describe('getUnreadAlerts', () => {
    it('should return unread alerts for the user', async () => {
      const alerts = [mockAlert];
      mockAlertsService.getUnreadAlerts.mockResolvedValue(alerts);

      const result = await controller.getUnreadAlerts(
        { user: { sub: 1 } } as any,
        '20',
      );

      expect(service.getUnreadAlerts).toHaveBeenCalledWith(1, 20);
      expect(result.success).toBe(true);
      expect(result.alerts).toEqual(alerts);
    });

    it('should use custom limit if provided', async () => {
      mockAlertsService.getUnreadAlerts.mockResolvedValue([]);

      await controller.getUnreadAlerts({ user: { sub: 1 } } as any, '50');

      expect(service.getUnreadAlerts).toHaveBeenCalledWith(1, 50);
    });

    it('should default to limit 20', async () => {
      mockAlertsService.getUnreadAlerts.mockResolvedValue([]);

      await controller.getUnreadAlerts({ user: { sub: 1 } } as any);

      expect(service.getUnreadAlerts).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('getUserAlerts', () => {
    it('should return paginated alerts for the user', async () => {
      const alerts = [mockAlert];
      mockAlertsService.getUserAlerts.mockResolvedValue({
        alerts,
        total: 1,
        hasMore: false,
      });

      const result = await controller.getUserAlerts(
        { user: { sub: 1 } } as any,
        '1',
        '20',
      );

      expect(service.getUserAlerts).toHaveBeenCalledWith(1, 1, 20);
      expect(result.success).toBe(true);
      expect(result.alerts).toEqual(alerts);
    });

    it('should handle pagination correctly', async () => {
      mockAlertsService.getUserAlerts.mockResolvedValue({
        alerts: [mockAlert],
        total: 50,
        hasMore: true,
      });

      const result = await controller.getUserAlerts(
        { user: { sub: 1 } } as any,
        '2',
        '25',
      );

      expect(service.getUserAlerts).toHaveBeenCalledWith(1, 2, 25);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark an alert as read', async () => {
      const readAlert = { ...mockAlert, isRead: true };
      mockAlertsService.markAsRead.mockResolvedValue(readAlert);

      const result = await controller.markAsRead(
        { user: { sub: 1 } } as any,
        '1',
      );

      expect(service.markAsRead).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.alert?.isRead).toBe(true);
    });

    it('should reject if alert does not belong to user', async () => {
      const otherUserAlert = { ...mockAlert, userId: 2 };
      mockAlertsService.markAsRead.mockResolvedValue(otherUserAlert);

      const result = await controller.markAsRead(
        { user: { sub: 1 } } as any,
        '1',
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read', async () => {
      mockAlertsService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead({
        user: { sub: 1 },
      } as any);

      expect(service.markAllAsRead).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.message).toBe('All alerts marked as read');
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert', async () => {
      mockAlertsService.deleteAlertForUser.mockResolvedValue(true);

      const result = await controller.deleteAlert(
        { user: { sub: 1 } } as any,
        '1',
      );

      expect(service.deleteAlertForUser).toHaveBeenCalledWith(1, 1);
      expect(result.success).toBe(true);
    });

    it('should throw NotFound when alert not owned or not found', async () => {
      mockAlertsService.deleteAlertForUser.mockResolvedValue(false);

      await expect(
        controller.deleteAlert({ user: { sub: 1 } } as any, '99'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAlertCountByType', () => {
    it('should return alert counts by type', async () => {
      const counts = {
        [AlertType.FOLLOWER]: 5,
        [AlertType.COMMENT]: 3,
        [AlertType.REACTION]: 2,
        [AlertType.MENTION]: 1,
        [AlertType.SYSTEM]: 0,
      };
      mockAlertsService.getAlertCountByType.mockResolvedValue(counts);

      const result = await controller.getAlertCountByType({
        user: { sub: 1 },
      } as any);

      expect(service.getAlertCountByType).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.counts).toEqual(counts);
    });

    it('should handle zero counts', async () => {
      const counts = {
        [AlertType.FOLLOWER]: 0,
        [AlertType.COMMENT]: 0,
        [AlertType.REACTION]: 0,
        [AlertType.MENTION]: 0,
        [AlertType.SYSTEM]: 0,
      };
      mockAlertsService.getAlertCountByType.mockResolvedValue(counts);

      const result = await controller.getAlertCountByType({
        user: { sub: 1 },
      } as any);

      expect(result.counts[AlertType.FOLLOWER]).toBe(0);
    });
  });
});
