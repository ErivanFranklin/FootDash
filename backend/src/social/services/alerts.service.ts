import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType } from '../entities/alert.entity';

export interface CreateAlertDto {
  userId: number;
  alertType: AlertType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedUserId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  /**
   * Create and store a new alert for a user
   */
  async createAlert(dto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      userId: dto.userId,
      alertType: dto.alertType,
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl,
      relatedUserId: dto.relatedUserId,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      isRead: false,
    });

    return await this.alertRepository.save(alert);
  }

  /**
   * Get unread alerts for a user
   */
  async getUnreadAlerts(userId: number, limit: number = 20): Promise<Alert[]> {
    return await this.alertRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'relatedUser'],
    });
  }

  /**
   * Get all alerts for a user with pagination
   */
  async getUserAlerts(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ alerts: Alert[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    const [alerts, total] = await this.alertRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['user', 'relatedUser'],
    });

    return {
      alerts,
      total,
      hasMore: skip + alerts.length < total,
    };
  }

  /**
   * Mark a single alert as read
   */
  async markAsRead(alertId: number): Promise<Alert | null> {
    await this.alertRepository.update({ id: alertId }, { isRead: true });
    return await this.alertRepository.findOne({ where: { id: alertId } });
  }

  /**
   * Mark all alerts as read for a user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.alertRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * Delete a single alert
   */
  async deleteAlert(alertId: number): Promise<void> {
    await this.alertRepository.delete({ id: alertId });
  }

  /**
   * Delete a single alert only if it belongs to the given user
   * Returns true when an alert was deleted, false otherwise
   */
  async deleteAlertForUser(alertId: number, userId: number): Promise<boolean> {
    const result = await this.alertRepository.delete({ id: alertId, userId });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Delete old alerts (older than X days)
   */
  async deleteOldAlerts(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.alertRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();
  }

  /**
   * Get alert count by type for a user
   */
  async getAlertCountByType(
    userId: number,
  ): Promise<Record<AlertType, number>> {
    const result = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.alertType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('alert.userId = :userId', { userId })
      .groupBy('alert.alertType')
      .getRawMany();

    const counts: Record<AlertType, number> = {
      [AlertType.FOLLOWER]: 0,
      [AlertType.REACTION]: 0,
      [AlertType.COMMENT]: 0,
      [AlertType.MENTION]: 0,
      [AlertType.SYSTEM]: 0,
    };

    result.forEach((row) => {
      const alertType = row.type as AlertType;
      counts[alertType] = parseInt(row.count, 10);
    });

    return counts;
  }

  /**
   * Create bulk alerts for multiple users
   */
  async createBulkAlerts(dtos: CreateAlertDto[]): Promise<Alert[]> {
    const alerts = this.alertRepository.create(
      dtos.map((dto) => ({
        userId: dto.userId,
        alertType: dto.alertType,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl,
        relatedUserId: dto.relatedUserId,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        isRead: false,
      })),
    );

    return await this.alertRepository.save(alerts);
  }
}
