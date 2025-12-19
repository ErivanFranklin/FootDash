export enum ReportTargetType {
  COMMENT = 'comment',
  USER = 'user',
  PREDICTION = 'prediction',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE = 'inappropriate',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

export interface CreateReportDto {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description?: string;
}

export interface Report {
  id: number;
  reporterId: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description?: string;
  isResolved: boolean;
  createdAt: string;
}
