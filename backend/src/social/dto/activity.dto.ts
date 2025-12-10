import { ActivityType, ActivityTargetType } from '../entities/user-activity.entity';

export class ActivityResponseDto {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  activityType: ActivityType;
  targetType: ActivityTargetType;
  targetId: number;
  targetName?: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
