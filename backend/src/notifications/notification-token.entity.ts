import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'notification_tokens' })
@Index(['token'], { unique: true })
export class NotificationToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  token!: string;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  platform?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
