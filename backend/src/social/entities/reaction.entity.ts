import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

export enum ReactionTargetType {
  COMMENT = 'comment',
  PREDICTION = 'prediction',
  MATCH = 'match',
}

@Entity('reactions')
@Index('IDX_REACTIONS_UNIQUE', ['userId', 'targetType', 'targetId'], { unique: true })
@Index('IDX_REACTIONS_TARGET', ['targetType', 'targetId'])
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'target_type', type: 'enum', enum: ReactionTargetType })
  targetType: ReactionTargetType;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'reaction_type', type: 'enum', enum: ReactionType })
  reactionType: ReactionType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
