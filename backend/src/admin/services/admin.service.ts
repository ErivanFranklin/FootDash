import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { Report } from '../../social/entities/report.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  /**
   * Get all users with optional filtering
   */
  async getAllUsers(limit = 50, offset = 0) {
    const [users, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      total,
      limit,
      offset,
    };
  }

  /**
   * Search users by email
   */
  async searchUsers(email: string, limit = 50) {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email ILIKE :email', { email: `%${email}%` })
      .take(limit)
      .getMany();

    return users;
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Block/disable a user account
   */
  async blockUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Cannot block admin users');
    }

    // Set a flag to indicate the user is blocked (add blocked_at timestamp)
    await this.usersRepository.update(userId, {
      blocked_at: new Date(),
    });

    return { message: 'User blocked successfully', userId };
  }

  /**
   * Unblock a user account
   */
  async unblockUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.usersRepository.update(userId, {
      blocked_at: null,
    });

    return { message: 'User unblocked successfully', userId };
  }

  /**
   * Delete a user account
   */
  async deleteUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Cannot delete admin users');
    }

    await this.usersRepository.remove(user);

    return { message: 'User deleted successfully', userId };
  }

  /**
   * Get all reports for moderation
   */
  async getAllReports(limit = 50, offset = 0, status?: string) {
    const query = this.reportsRepository.createQueryBuilder('report');

    if (status) {
      query.where('report.status = :status', { status });
    }

    query.orderBy('report.createdAt', 'DESC').take(limit).skip(offset);

    const [reports, total] = await query.getManyAndCount();

    return {
      data: reports,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get report details
   */
  async getReportDetails(reportId: number) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['reporter', 'targetUser', 'targetComment'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return report;
  }

  /**
   * Approve/resolve a report (action taken against content)
   */
  async approveReport(
    reportId: number,
    action: 'block_user' | 'delete_comment' | 'warn_user',
  ) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['targetUser', 'targetComment'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Update report status
    await this.reportsRepository.update(reportId, {
      status: 'resolved',
      resolvedAt: new Date(),
    });

    // Perform the requested action
    if (action === 'block_user' && report.targetUser) {
      await this.blockUser(report.targetUser.id);
    } else if (action === 'delete_comment' && report.targetComment) {
      // Delete the comment (implementation depends on comment entity)
      // This is a placeholder - actual implementation would delete from activity/comment table
    }

    return { message: 'Report approved and action taken', reportId, action };
  }

  /**
   * Reject/dismiss a report
   */
  async rejectReport(reportId: number) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    await this.reportsRepository.update(reportId, {
      status: 'rejected',
      resolvedAt: new Date(),
    });

    return { message: 'Report rejected', reportId };
  }

  /**
   * Get system health and statistics
   */
  async getSystemHealth() {
    const totalUsers = await this.usersRepository.count();
    const adminCount = await this.usersRepository.count({
      where: { role: 'admin' },
    });
    const totalReports = await this.reportsRepository.count();
    const pendingReports = await this.reportsRepository.count({
      where: { status: 'pending' },
    });

    return {
      timestamp: new Date(),
      database: {
        status: 'connected',
        users: {
          total: totalUsers,
          admins: adminCount,
        },
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
      websockets: {
        activeConnections: 0, // To be populated by WebSocket gateway
      },
    };
  }
}
