import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  token!: string;

  @ManyToOne(() => User, (user) => (user as any).refreshTokens, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ default: false })
  revoked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
