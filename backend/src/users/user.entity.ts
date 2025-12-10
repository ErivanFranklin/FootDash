import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
// Do NOT import User from './user.entity' here; this file defines and exports it.

// If you have related entities, import them here (avoid circular imports). Example:
// import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Map to snake_case column in DB
  @Column({ name: 'password_hash' })
  password_hash: string;

  // Map to snake_case created_at
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Example relation (uncomment if RefreshToken entity exists and avoid circular imports)
  // @OneToMany(() => RefreshToken, (rt) => rt.user, { cascade: true })
  // refreshTokens: RefreshToken[];
}
