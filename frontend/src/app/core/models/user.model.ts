export interface User {
  id: number;
  username?: string;
  email: string;
  avatar?: string;
  isPro?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
