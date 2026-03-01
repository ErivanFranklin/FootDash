import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
@Unique('UQ_user_badge', ['userId', 'badgeId'])
export class UserBadge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'badge_id' })
  badgeId: number;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Badge, (b) => b.userBadges, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;
}
