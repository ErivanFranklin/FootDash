import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum ActivityType {
  COMMENT = 'comment',
  REACTION = 'reaction',
  PREDICTION = 'prediction',
  FOLLOW = 'follow',
}

export enum ActivityTargetType {
  MATCH = 'match',
  PREDICTION = 'prediction',
  COMMENT = 'comment',
  USER = 'user',
}

@Entity('user_activity')
@Index('IDX_USER_ACTIVITY_USER_ID', ['userId'])
@Index('IDX_USER_ACTIVITY_CREATED_AT', ['createdAt'])
@Index('IDX_USER_ACTIVITY_TARGET', ['targetType', 'targetId'])
export class UserActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'activity_type', type: 'enum', enum: ActivityType })
  activityType: ActivityType;

  @Column({ name: 'target_type', type: 'enum', enum: ActivityTargetType })
  targetType: ActivityTargetType;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
