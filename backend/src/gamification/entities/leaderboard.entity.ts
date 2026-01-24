import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int' })
  rank: number;

  @Column()
  period: string; // 'weekly', 'monthly', 'all-time'

  @Column({ name: 'period_identifier' })
  periodIdentifier: string; 
}
