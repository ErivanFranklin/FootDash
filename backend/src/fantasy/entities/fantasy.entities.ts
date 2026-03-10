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

  @Column({ name: 'invite_code', type: 'varchar', length: 8, unique: true })
  inviteCode: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ name: 'max_members', type: 'int', default: 20 })
  maxMembers: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: 'draft' | 'active' | 'completed';

  @Column({ name: 'scoring_rules', type: 'simple-json', nullable: true })
  scoringRules: Record<string, number>;

  @Column({ type: 'varchar', length: 10, default: '2025' })
  season: string;

  @Column({
    name: 'league_id',
    type: 'int',
    default: 39,
    comment: 'Football API league ID',
  })
  leagueId: number;

  @OneToMany(() => FantasyTeam, (t) => t.league)
  teams: FantasyTeam[];

  @OneToMany(() => FantasyGameweek, (gw) => gw.league)
  gameweeks: FantasyGameweek[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
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
  @JoinColumn({ name: 'fantasy_league_id' })
  league: FantasyLeague;

  @Column({ name: 'fantasy_league_id' })
  leagueId: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 100.0,
    comment: 'Budget in millions',
  })
  budget: number;

  @Column({ name: 'total_points', type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'varchar', length: 10, default: '4-3-3' })
  formation: string;

  @Column({ name: 'free_transfers_remaining', type: 'int', default: 2 })
  freeTransfersRemaining: number;

  @OneToMany(() => FantasyRoster, (r) => r.fantasyTeam)
  roster: FantasyRoster[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
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

  @Column({
    name: 'player_id',
    type: 'int',
    comment: 'References Player entity id',
  })
  playerId: number;

  @Column({ type: 'varchar', length: 5 })
  position: 'GK' | 'DEF' | 'MID' | 'FWD';

  @Column({ name: 'is_captain', type: 'boolean', default: false })
  isCaptain: boolean;

  @Column({ name: 'is_vice_captain', type: 'boolean', default: false })
  isViceCaptain: boolean;

  @Column({
    name: 'purchase_price',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  purchasePrice: number;

  @Column({
    name: 'is_starter',
    type: 'boolean',
    default: true,
    comment: 'In starting XI vs bench',
  })
  isStarter: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
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

  @Column({ name: 'week_number', type: 'int' })
  weekNumber: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
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

  @Column({
    name: 'player_id',
    type: 'int',
    comment: 'References Player entity id',
  })
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
