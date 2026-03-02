import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity({ name: 'fantasy_leagues' })
export class FantasyLeague {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 8, unique: true })
  inviteCode: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ type: 'int', default: 20 })
  maxMembers: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: 'draft' | 'active' | 'completed';

  @Column({ type: 'simple-json', nullable: true })
  scoringRules: Record<string, number>;

  @Column({ type: 'varchar', length: 10, default: '2025' })
  season: string;

  @Column({ type: 'int', default: 39, comment: 'Football API league ID' })
  leagueId: number;

  @OneToMany(() => FantasyTeam, (t) => t.league)
  teams: FantasyTeam[];

  @OneToMany(() => FantasyGameweek, (gw) => gw.league)
  gameweeks: FantasyGameweek[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'fantasy_teams' })
export class FantasyTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => FantasyLeague, (l) => l.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'league_id' })
  league: FantasyLeague;

  @Column({ name: 'league_id' })
  leagueId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100.0, comment: 'Budget in millions' })
  budget: number;

  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'varchar', length: 10, default: '4-3-3' })
  formation: string;

  @Column({ type: 'int', default: 2 })
  freeTransfersRemaining: number;

  @OneToMany(() => FantasyRoster, (r) => r.fantasyTeam)
  roster: FantasyRoster[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'fantasy_rosters' })
export class FantasyRoster {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FantasyTeam, (t) => t.roster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fantasy_team_id' })
  fantasyTeam: FantasyTeam;

  @Column({ name: 'fantasy_team_id' })
  fantasyTeamId: number;

  @Column({ type: 'int', comment: 'References Player entity id' })
  playerId: number;

  @Column({ type: 'varchar', length: 5 })
  position: 'GK' | 'DEF' | 'MID' | 'FWD';

  @Column({ type: 'boolean', default: false })
  isCaptain: boolean;

  @Column({ type: 'boolean', default: false })
  isViceCaptain: boolean;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  purchasePrice: number;

  @Column({ type: 'boolean', default: true, comment: 'In starting XI vs bench' })
  isStarter: boolean;
}

@Entity({ name: 'fantasy_gameweeks' })
export class FantasyGameweek {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FantasyLeague, (l) => l.gameweeks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'league_id' })
  league: FantasyLeague;

  @Column({ name: 'league_id' })
  leagueId: number;

  @Column({ type: 'int' })
  weekNumber: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'upcoming',
  })
  status: 'upcoming' | 'live' | 'completed';

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @OneToMany(() => FantasyPoints, (fp) => fp.gameweek)
  points: FantasyPoints[];
}

@Entity({ name: 'fantasy_points' })
export class FantasyPoints {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FantasyTeam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fantasy_team_id' })
  fantasyTeam: FantasyTeam;

  @Column({ name: 'fantasy_team_id' })
  fantasyTeamId: number;

  @Column({ type: 'int', comment: 'References Player entity id' })
  playerId: number;

  @ManyToOne(() => FantasyGameweek, (gw) => gw.points, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameweek_id' })
  gameweek: FantasyGameweek;

  @Column({ name: 'gameweek_id' })
  gameweekId: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'simple-json', nullable: true })
  breakdown: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;
}
