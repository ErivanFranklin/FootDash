import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserRole } from '../../users/user.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getAllUsers: jest.fn(),
    searchUsers: jest.fn(),
    getUserDetails: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllReports: jest.fn(),
    getReportDetails: jest.fn(),
    approveReport: jest.fn(),
    rejectReport: jest.fn(),
    getSystemHealth: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password_hash: 'hash',
    role: UserRole.USER,
    createdAt: new Date(),
    blocked_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);

    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users', async () => {
      const expected = {
        data: [mockUser],
        total: 1,
        limit: 50,
        offset: 0,
      };
      mockAdminService.getAllUsers.mockResolvedValue(expected);

      const result = await controller.getAllUsers('50', '0');

      expect(result).toEqual(expected);
      expect(service.getAllUsers).toHaveBeenCalledWith(50, 0);
    });

    it('should use default pagination values', async () => {
      mockAdminService.getAllUsers.mockResolvedValue({ data: [] });

      await controller.getAllUsers();

      expect(service.getAllUsers).toHaveBeenCalledWith(50, 0);
    });
  });

  describe('GET /api/admin/users/search', () => {
    it('should search users by email', async () => {
      mockAdminService.searchUsers.mockResolvedValue([mockUser]);

      const result = await controller.searchUsers('test@example.com');

      expect(result).toEqual([mockUser]);
      expect(service.searchUsers).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error when email is missing', async () => {
      expect(() => controller.searchUsers('')).toThrow();
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    it('should return user details', async () => {
      mockAdminService.getUserDetails.mockResolvedValue(mockUser);

      const result = await controller.getUserDetails('1');

      expect(result).toEqual(mockUser);
      expect(service.getUserDetails).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/admin/users/:userId/block', () => {
    it('should block a user', async () => {
      const expected = { message: 'User blocked successfully', userId: 1 };
      mockAdminService.blockUser.mockResolvedValue(expected);

      const result = await controller.blockUser('1');

      expect(result).toEqual(expected);
      expect(service.blockUser).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/admin/users/:userId/unblock', () => {
    it('should unblock a user', async () => {
      const expected = { message: 'User unblocked successfully', userId: 1 };
      mockAdminService.unblockUser.mockResolvedValue(expected);

      const result = await controller.unblockUser('1');

      expect(result).toEqual(expected);
      expect(service.unblockUser).toHaveBeenCalledWith(1);
    });
  });

  describe('DELETE /api/admin/users/:userId', () => {
    it('should delete a user', async () => {
      const expected = { message: 'User deleted successfully', userId: 1 };
      mockAdminService.deleteUser.mockResolvedValue(expected);

      const result = await controller.deleteUser('1');

      expect(result).toEqual(expected);
      expect(service.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('should return paginated reports', async () => {
      const expected = {
        data: [{ id: 1, reason: 'Spam', status: 'pending' }],
        total: 1,
        limit: 50,
        offset: 0,
      };
      mockAdminService.getAllReports.mockResolvedValue(expected);

      const result = await controller.getAllReports('50', '0');

      expect(result).toEqual(expected);
      expect(service.getAllReports).toHaveBeenCalledWith(50, 0, undefined);
    });

    it('should filter reports by status', async () => {
      const expected = { data: [], total: 0, limit: 50, offset: 0 };
      mockAdminService.getAllReports.mockResolvedValue(expected);

      await controller.getAllReports('50', '0', 'pending');

      expect(service.getAllReports).toHaveBeenCalledWith(50, 0, 'pending');
    });
  });

  describe('GET /api/admin/reports/:reportId', () => {
    it('should return report details', async () => {
      const expected = { id: 1, reason: 'Spam', status: 'pending' };
      mockAdminService.getReportDetails.mockResolvedValue(expected);

      const result = await controller.getReportDetails('1');

      expect(result).toEqual(expected);
      expect(service.getReportDetails).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/admin/reports/:reportId/approve', () => {
    it('should approve report with action', async () => {
      const expected = {
        message: 'Report approved and action taken',
        reportId: 1,
        action: 'block_user',
      };
      mockAdminService.approveReport.mockResolvedValue(expected);

      const result = await controller.approveReport('1', 'block_user');

      expect(result).toEqual(expected);
      expect(service.approveReport).toHaveBeenCalledWith(1, 'block_user');
    });
  });

  describe('POST /api/admin/reports/:reportId/reject', () => {
    it('should reject a report', async () => {
      const expected = { message: 'Report rejected', reportId: 1 };
      mockAdminService.rejectReport.mockResolvedValue(expected);

      const result = await controller.rejectReport('1');

      expect(result).toEqual(expected);
      expect(service.rejectReport).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /api/admin/health', () => {
    it('should return system health stats', async () => {
      const expected = {
        timestamp: expect.any(Date),
        database: {
          status: 'connected',
          users: { total: 100, admins: 2 },
        },
        reports: { total: 25, pending: 5 },
        websockets: { activeConnections: 10 },
      };
      mockAdminService.getSystemHealth.mockResolvedValue(expected);

      const result = await controller.getSystemHealth();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('reports');
      expect(result).toHaveProperty('websockets');
      expect(service.getSystemHealth).toHaveBeenCalled();
    });
  });
});
