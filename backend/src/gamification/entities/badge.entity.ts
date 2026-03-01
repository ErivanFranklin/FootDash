import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserBadge } from './user-badge.entity';

export enum BadgeTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum BadgeCriteriaType {
  PREDICTIONS_CORRECT = 'predictions_correct',
  PREDICTIONS_EXACT = 'predictions_exact',
  PREDICTIONS_STREAK = 'predictions_streak',
  FIRST_PREDICTION = 'first_prediction',
  FIRST_COMMENT = 'first_comment',
  COMMENTS_TOTAL = 'comments_total',
  FOLLOWERS_COUNT = 'followers_count',
  FOLLOWING_COUNT = 'following_count',
  PRO_SUBSCRIBER = 'pro_subscriber',
  LEADERBOARD_TOP = 'leaderboard_top',
  LOGIN_STREAK = 'login_streak',
  EARLY_PREDICTOR = 'early_predictor',
}

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 50, default: BadgeTier.BRONZE })
  tier: BadgeTier;

  @Column({ type: 'varchar', length: 50, name: 'criteria_type' })
  criteriaType: BadgeCriteriaType;

  @Column({ type: 'int', default: 1 })
  threshold: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserBadge, (ub) => ub.badge)
  userBadges: UserBadge[];
}
