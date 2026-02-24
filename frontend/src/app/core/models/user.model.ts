export interface User {
  id: number;
  email: string;
  username?: string;
  avatar?: string;
  createdAt: string | Date;
  isPro: boolean;
}
