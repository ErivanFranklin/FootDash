import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id!: number;

  /** SHA-256 hash of the raw token (raw token is sent in the email link). */
  @Column('text')
  tokenHash!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: number;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  /** Set when the token is consumed — prevents reuse. */
  @Column({ type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
