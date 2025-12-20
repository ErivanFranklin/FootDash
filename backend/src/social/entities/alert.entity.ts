import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum AlertType {
  FOLLOWER = 'follower', // User followed you
  REACTION = 'reaction', // Someone reacted to your activity
  COMMENT = 'comment', // Someone commented on your activity
  MENTION = 'mention', // You were mentioned in a comment
  SYSTEM = 'system', // System notifications
}

@Entity('alerts')
@Index(['userId', 'createdAt']) // For efficient querying of user alerts
@Index(['userId', 'isRead']) // For efficient querying of unread alerts
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alertType: AlertType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ nullable: true })
  actionUrl?: string;

  // Reference to related user (e.g., who followed you)
  @Column({ nullable: true })
  relatedUserId?: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  relatedUser?: User;

  // Reference to related entity (e.g., a match, prediction, comment)
  @Column({ nullable: true })
  relatedEntityType?: string; // 'match', 'prediction', 'comment', etc.

  @Column({ nullable: true })
  relatedEntityId?: number;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
