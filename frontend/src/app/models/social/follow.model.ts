export interface Follow {
  id: number;
  followerId: number;
  followingId: number;
  followerName?: string;
  followingName?: string;
  createdAt: string;
}

export interface CreateFollowRequest {
  followingId: number;
}

export interface FollowStats {
  userId: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface UserListItem {
  id: number;
  email: string;
  createdAt: string;
  isFollowing?: boolean;
}

export interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
