import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ default: false })
  revoked: boolean;

  // map to snake_case created_at in DB
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // store foreign key in snake_case user_id and set up relation to User
  @ManyToOne(() => User, (user) => (user as any).refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // explicit userId column mapped to snake_case to match existing DB conventions/queries
  @Column({ name: 'user_id' })
  userId: string;
}
