export interface User {
  id: number;
  username?: string;
  email: string;
  avatar?: string;
  isPro?: boolean;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: Date | string;
  updatedAt?: Date | string;
}
