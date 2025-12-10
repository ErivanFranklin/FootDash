export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry'
}

export enum ReactionTargetType {
  COMMENT = 'comment',
  PREDICTION = 'prediction',
  MATCH = 'match'
}

export interface Reaction {
  id: number;
  userId: number;
  userName: string;
  targetType: ReactionTargetType;
  targetId: number;
  reactionType: ReactionType;
  createdAt: string;
}

export interface CreateReactionRequest {
  targetType: ReactionTargetType;
  targetId: number;
  reactionType: ReactionType;
}

export interface ReactionSummary {
  targetType: ReactionTargetType;
  targetId: number;
  like: number;
  love: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
  userReaction?: ReactionType;
}
