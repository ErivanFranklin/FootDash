import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { User, UserRole } from '../../users/user.entity';
import { Report } from '../../social/entities/report.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let usersRepository: Repository<User>;
  let reportsRepository: Repository<Report>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password_hash: 'hash',
    role: UserRole.USER,
    createdAt: new Date(),
    blocked_at: null,
  };

  const mockAdminUser: User = {
    id: 2,
    email: 'admin@example.com',
    password_hash: 'hash',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    blocked_at: null,
  };

  const mockReport: Report = {
    id: 1,
    reason: 'Inappropriate content',
    status: 'pending',
    createdAt: new Date(),
    resolvedAt: null,
    reporter: mockUser,
    targetUser: mockUser,
    targetComment: null,
  };

  const mockUsersRepository = {
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockReportsRepository = {
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportsRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    reportsRepository = module.get<Repository<Report>>(getRepositoryToken(Report));

    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return paginated list of users', async () => {
      const users = [mockUser, mockAdminUser];
      mockUsersRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.getAllUsers(50, 0);

      expect(result).toEqual({
        data: users,
        total: 2,
        limit: 50,
        offset: 0,
      });
      expect(usersRepository.findAndCount).toHaveBeenCalledWith({
        take: 50,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle empty user list', async () => {
      mockUsersRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAllUsers(50, 0);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('searchUsers', () => {
    it('should search users by email', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsers('test@example.com');

      expect(result).toEqual([mockUser]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.email ILIKE :email',
        { email: '%test@example.com%' },
      );
    });

    it('should return empty array when no users match', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockUsersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchUsers('nonexistent@example.com');

      expect(result).toEqual([]);
    });
  });

  describe('getUserDetails', () => {
    it('should return user details', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserDetails(1);

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserDetails(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('blockUser', () => {
    it('should block a regular user', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.blockUser(1);

      expect(result.message).toBe('User blocked successfully');
      expect(usersRepository.update).toHaveBeenCalledWith(1, {
        blocked_at: expect.any(Date),
      });
    });

    it('should not allow blocking admin users', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockAdminUser);

      await expect(service.blockUser(2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.blockUser(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a blocked user', async () => {
      const blockedUser = { ...mockUser, blocked_at: new Date() };
      mockUsersRepository.findOne.mockResolvedValue(blockedUser);
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.unblockUser(1);

      expect(result.message).toBe('User unblocked successfully');
      expect(usersRepository.update).toHaveBeenCalledWith(1, {
        blocked_at: null,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.unblockUser(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a regular user', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.remove.mockResolvedValue(mockUser);

      const result = await service.deleteUser(1);

      expect(result.message).toBe('User deleted successfully');
      expect(usersRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should not allow deleting admin users', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockAdminUser);

      await expect(service.deleteUser(2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUser(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllReports', () => {
    it('should return paginated list of reports', async () => {
      const reports = [mockReport];
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([reports, 1]),
      };
      mockReportsRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getAllReports(50, 0);

      expect(result).toEqual({
        data: reports,
        total: 1,
        limit: 50,
        offset: 0,
      });
    });

    it('should filter reports by status', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReport], 1]),
      };
      mockReportsRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.getAllReports(50, 0, 'pending');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'report.status = :status',
        { status: 'pending' },
      );
    });
  });

  describe('getReportDetails', () => {
    it('should return report details with relations', async () => {
      mockReportsRepository.findOne.mockResolvedValue(mockReport);

      const result = await service.getReportDetails(1);

      expect(result).toEqual(mockReport);
      expect(reportsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['reporter', 'targetUser', 'targetComment'],
      });
    });

    it('should throw NotFoundException when report not found', async () => {
      mockReportsRepository.findOne.mockResolvedValue(null);

      await expect(service.getReportDetails(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveReport', () => {
    it('should approve report and block user', async () => {
      mockReportsRepository.findOne.mockResolvedValue(mockReport);
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockReportsRepository.update.mockResolvedValue({});
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.approveReport(1, 'block_user');

      expect(result.message).toBe('Report approved and action taken');
      expect(result.action).toBe('block_user');
      expect(reportsRepository.update).toHaveBeenCalledWith(1, {
        status: 'resolved',
        resolvedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when report not found', async () => {
      mockReportsRepository.findOne.mockResolvedValue(null);

      await expect(service.approveReport(999, 'block_user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rejectReport', () => {
    it('should reject a report', async () => {
      mockReportsRepository.findOne.mockResolvedValue(mockReport);
      mockReportsRepository.update.mockResolvedValue({});

      const result = await service.rejectReport(1);

      expect(result.message).toBe('Report rejected');
      expect(reportsRepository.update).toHaveBeenCalledWith(1, {
        status: 'rejected',
        resolvedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when report not found', async () => {
      mockReportsRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectReport(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health stats', async () => {
      mockUsersRepository.count.mockResolvedValue(100);
      const adminCountQueryBuilder = {
        count: jest.fn().mockResolvedValue(2),
      };

      mockUsersRepository.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(2);
      mockReportsRepository.count
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(5);

      const result = await service.getSystemHealth();

      expect(result).toHaveProperty('timestamp');
      expect(result.database.status).toBe('connected');
      expect(result.database.users.total).toBe(100);
      expect(result.database.users.admins).toBe(2);
      expect(result.reports.total).toBe(25);
      expect(result.reports.pending).toBe(5);
    });
  });
});
