import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Match } from '../../matches/entities/match.entity';

@Entity('user_predictions')
export class UserPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id' })
  matchId: number;

  @Column({ name: 'home_score', type: 'int' })
  homeScore: number;

  @Column({ name: 'away_score', type: 'int' })
  awayScore: number;

  @Column({ type: 'int', nullable: true })
  points: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
