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

  // Let TypeORM pick a DB-appropriate date/time column type (sqlite -> datetime, postgres -> timestamp)
  @Column({ nullable: true })
  kickOff?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status?: string;

  @Column({ type: 'int', nullable: true })
  homeScore?: number;

  @Column({ type: 'int', nullable: true })
  awayScore?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referee?: string;

  // Store venue and league as JSON so we can persist structured metadata
  @Column({ type: 'simple-json', nullable: true })
  venue?: {
    id?: number | null;
    name?: string | null;
    city?: string | null;
    capacity?: number | null;
    image?: string | null;
  } | null;

  @Column({ type: 'simple-json', nullable: true })
  league?: {
    id?: number | null;
    name?: string | null;
    country?: string | null;
    logo?: string | null;
    season?: number | null;
  } | null;
}
