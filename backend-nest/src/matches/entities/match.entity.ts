import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';

@Entity({ name: 'matches' })
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, unique: true })
  externalId?: number;

  @ManyToOne(() => Team, (t) => t.homeMatches, { eager: true })
  homeTeam: Team;

  @ManyToOne(() => Team, (t) => t.awayMatches, { eager: true })
  awayTeam: Team;

  // Use a sqlite-compatible column type for in-memory tests
  @Column({ type: 'datetime', nullable: true })
  kickOff?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status?: string;

  @Column({ type: 'int', nullable: true })
  homeScore?: number;

  @Column({ type: 'int', nullable: true })
  awayScore?: number;
}
