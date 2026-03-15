import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { User, UserRole } from '../users/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockRepo = () => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    save: jest.fn().mockImplementation(item => Promise.resolve({ id: 1, ...item })),
    createQueryBuilder: jest.fn(() => qb),
    qb,
  };
};

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('getDashboardStats', () => {
    it('should return aggregated counts', async () => {
      userRepo.count.mockResolvedValueOnce(100); 
      userRepo.count.mockResolvedValueOnce(5);   
      userRepo.count.mockResolvedValueOnce(20);  
      userRepo.qb.getCount.mockResolvedValue(10); 
      
      const stats = await service.getDashboardStats();
      expect(stats.totalUsers).toBe(100);
      expect(stats.totalAdmins).toBe(5);
      expect(stats.totalProUsers).toBe(20);
      expect(stats.newUsersLast7Days).toBe(10);
    });
  });

  describe('listUsers', () => {
    it('should list users with default parameters', async () => {
      userRepo.qb.getManyAndCount.mockResolvedValue([[{ id: 1, email: 'a@b.com' }], 1]);
      const result = await service.listUsers();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(userRepo.qb.take).toHaveBeenCalledWith(50);
    });
  });

  describe('updateUserRole', () => {
    it('throws NotFoundException if user missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUserRole(1, UserRole.MODERATOR)).rejects.toThrow(NotFoundException);
    });

    it('allows super admin to become ADMIN', async () => {
      const superUser = { id: 1, email: 'erivanf10@gmail.com', role: UserRole.USER };
      userRepo.findOne.mockResolvedValue(superUser);
      const result = await service.updateUserRole(1, UserRole.ADMIN);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('prevents non-super admin from becoming ADMIN', async () => {
      const normalUser = { id: 2, email: 'normal@test.com', role: UserRole.USER };
      userRepo.findOne.mockResolvedValue(normalUser);
      await expect(service.updateUserRole(2, UserRole.ADMIN)).rejects.toThrow(BadRequestException);
    });

    it('prevents super admin role change if changed from ADMIN', async () => {
      const superUser = { id: 1, email: 'erivanf10@gmail.com', role: UserRole.ADMIN };
      userRepo.findOne.mockResolvedValue(superUser);
      await expect(service.updateUserRole(1, UserRole.MODERATOR)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateUserPro', () => {
    it('updates isPro status', async () => {
      const user = { id: 1, email: 'a@b.com', isPro: false };
      userRepo.findOne.mockResolvedValue(user);
      const result = await service.updateUserPro(1, true);
      expect(result.isPro).toBe(true);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException if user missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUserPro(1, true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers with filters', () => {
    it('applies all filters', async () => {
      await service.listUsers(10, 5, 'search', UserRole.MODERATOR, true);
      expect(userRepo.qb.take).toHaveBeenCalledWith(10);
      expect(userRepo.qb.skip).toHaveBeenCalledWith(5);
      expect(userRepo.qb.andWhere).toHaveBeenCalledWith('user.role = :roleFilter', { roleFilter: 'MODERATOR' });
      expect(userRepo.qb.andWhere).toHaveBeenCalledWith('user.is_pro = :isProFilter', { isProFilter: true });
    });
  });
});
