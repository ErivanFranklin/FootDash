import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('follows')
@Index('IDX_FOLLOWS_UNIQUE', ['followerId', 'followingId'], { unique: true })
@Index('IDX_FOLLOWS_FOLLOWER', ['followerId'])
@Index('IDX_FOLLOWS_FOLLOWING', ['followingId'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'follower_id' })
  followerId: number;

  @Column({ name: 'following_id' })
  followingId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'following_id' })
  following: User;
}
