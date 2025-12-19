import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum ReportTargetType {
  COMMENT = 'comment',
  USER = 'user',
  PREDICTION = 'prediction',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE = 'inappropriate',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: ReportTargetType,
    name: 'target_type',
  })
  targetType: ReportTargetType;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({
    type: 'enum',
    enum: ReportReason,
  })
  reason: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ name: 'is_resolved', type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ name: 'resolved_by_id', nullable: true })
  resolvedById?: number;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy?: User;
}
