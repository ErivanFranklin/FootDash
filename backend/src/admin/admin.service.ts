import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AdminService {
  private readonly superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL || 'erivanf10@gmail.com'
  ).toLowerCase();

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalAdmins, totalProUsers] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { role: UserRole.ADMIN } }),
      this.usersRepo.count({ where: { isPro: true } }),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsersLast7Days = await this.usersRepo
      .createQueryBuilder('user')
      .where('user.created_at >= :since', { since: sevenDaysAgo.toISOString() })
      .getCount();

    return {
      totalUsers,
      totalAdmins,
      totalProUsers,
      newUsersLast7Days,
    };
  }

  async listUsers(
    limit = 50,
    offset = 0,
    search?: string,
    roleFilter?: 'USER' | 'ADMIN' | 'MODERATOR',
    isProFilter?: boolean,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeOffset = Math.max(offset, 0);
    const normalizedSearch = search?.trim().toLowerCase();

    const query = this.usersRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.role',
        'user.isPro',
        'user.createdAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .take(safeLimit)
      .skip(safeOffset);

    // Dedicated role filter
    if (roleFilter) {
      query.andWhere('user.role = :roleFilter', { roleFilter });
    }

    // Dedicated isPro filter
    if (isProFilter !== undefined) {
      query.andWhere('user.is_pro = :isProFilter', { isProFilter });
    }

    // Text search across email, id
    if (normalizedSearch) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.email) LIKE :searchTerm', {
            searchTerm: `%${normalizedSearch}%`,
          })
            .orWhere('CAST(user.id AS TEXT) LIKE :idTerm', {
              idTerm: `%${normalizedSearch}%`,
            });
        }),
      );
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total, limit: safeLimit, offset: safeOffset };
  }

  async updateUserRole(userId: number, role: UserRole) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSuperAdmin = user.email.toLowerCase() === this.superAdminEmail;
    if (role === UserRole.ADMIN && !isSuperAdmin) {
      throw new BadRequestException('Only the configured super admin email can have ADMIN role');
    }
    if (isSuperAdmin && role !== UserRole.ADMIN) {
      throw new BadRequestException('Super admin role cannot be changed');
    }

    user.role = role;
    const saved = await this.usersRepo.save(user);
    return {
      id: saved.id,
      email: saved.email,
      role: saved.role,
      isPro: saved.isPro,
      createdAt: saved.createdAt,
    };
  }

  async updateUserPro(userId: number, isPro: boolean) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isPro = isPro;
    const saved = await this.usersRepo.save(user);
    return {
      id: saved.id,
      email: saved.email,
      role: saved.role,
      isPro: saved.isPro,
      createdAt: saved.createdAt,
    };
  }
}
