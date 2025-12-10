export interface Comment {
  id: number;
  userId: number;
  userName: string;
  matchId?: number;
  predictionId?: number;
  parentCommentId?: number;
  content: string;
  replyCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  matchId?: number;
  predictionId?: number;
  parentCommentId?: number;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
