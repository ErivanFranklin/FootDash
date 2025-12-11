import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Match } from '../../matches/entities/match.entity';
import { MatchPrediction } from '../../analytics/entities/match-prediction.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'match_id', nullable: true })
  matchId?: number;

  @Column({ name: 'prediction_id', nullable: true })
  predictionId?: number;

  @Column({ name: 'parent_comment_id', nullable: true })
  parentCommentId?: number;

  @Column({ type: 'varchar', length: 500 })
  content: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Match, { nullable: true })
  @JoinColumn({ name: 'match_id' })
  match?: Match;

  @ManyToOne(() => MatchPrediction, { nullable: true })
  @JoinColumn({ name: 'prediction_id' })
  prediction?: MatchPrediction;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];
}
