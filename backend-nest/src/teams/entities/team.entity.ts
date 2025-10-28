import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';

@Entity({ name: 'teams' })
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shortCode?: string;

  @OneToMany(() => Match, (m) => m.homeTeam)
  homeMatches?: Match[];

  @OneToMany(() => Match, (m) => m.awayTeam)
  awayMatches?: Match[];
}
