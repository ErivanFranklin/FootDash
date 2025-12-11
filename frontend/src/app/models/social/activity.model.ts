export enum ActivityType {
  COMMENT = 'comment',
  REACTION = 'reaction',
  PREDICTION = 'prediction',
  FOLLOW = 'follow'
}

export enum FeedType {
  GLOBAL = 'global',
  PERSONALIZED = 'personalized'
}

export enum ActivityTargetType {
  MATCH = 'match',
  PREDICTION = 'prediction',
  COMMENT = 'comment',
  USER = 'user'
}

export interface Activity {
  id: number;
  userId: number;
  userName: string;
  activityType: ActivityType;
  targetType: ActivityTargetType;
  targetId: number;
  metadata?: any;
  createdAt: string;
}

export interface PaginatedActivities {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FeedQuery {
  page?: number;
  limit?: number;
  activityType?: ActivityType;
}
