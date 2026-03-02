import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFantasyTables1772446820000 implements MigrationInterface {
  name = 'CreateFantasyTables1772446820000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fantasy_leagues" (
        "id"             SERIAL PRIMARY KEY,
        "name"           varchar(100) NOT NULL,
        "invite_code"    varchar(10)  NOT NULL UNIQUE,
        "owner_id"       integer      NOT NULL,
        "max_members"    integer      NOT NULL DEFAULT 20,
        "status"         varchar(20)  NOT NULL DEFAULT 'pending',
        "scoring_rules"  jsonb        NOT NULL DEFAULT '{}',
        "season"         varchar(10)  NOT NULL DEFAULT '2025',
        "league_id"      integer,
        "created_at"     TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fantasy_teams" (
        "id"                       SERIAL PRIMARY KEY,
        "name"                     varchar(100) NOT NULL,
        "user_id"                  integer      NOT NULL,
        "fantasy_league_id"        integer      NOT NULL,
        "budget"                   decimal(8,2) NOT NULL DEFAULT 100.00,
        "total_points"             integer      NOT NULL DEFAULT 0,
        "formation"                varchar(10)  NOT NULL DEFAULT '4-4-2',
        "free_transfers_remaining" integer      NOT NULL DEFAULT 2,
        "created_at"               TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"               TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "FK_fantasy_teams_league"
          FOREIGN KEY ("fantasy_league_id") REFERENCES "fantasy_leagues"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fantasy_rosters" (
        "id"               SERIAL PRIMARY KEY,
        "fantasy_team_id"  integer      NOT NULL,
        "player_id"        integer      NOT NULL,
        "position"         varchar(5)   NOT NULL,
        "is_captain"       boolean      NOT NULL DEFAULT false,
        "is_vice_captain"  boolean      NOT NULL DEFAULT false,
        "purchase_price"   decimal(5,2) NOT NULL DEFAULT 0.0,
        "is_starter"       boolean      NOT NULL DEFAULT true,
        "created_at"       TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "FK_fantasy_rosters_team"
          FOREIGN KEY ("fantasy_team_id") REFERENCES "fantasy_teams"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fantasy_gameweeks" (
        "id"          SERIAL PRIMARY KEY,
        "league_id"   integer      NOT NULL,
        "week_number" integer      NOT NULL,
        "start_date"  TIMESTAMP    NOT NULL,
        "end_date"    TIMESTAMP    NOT NULL,
        "status"      varchar(20)  NOT NULL DEFAULT 'upcoming',
        "processed"   boolean      NOT NULL DEFAULT false,
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "FK_fantasy_gameweeks_league"
          FOREIGN KEY ("league_id") REFERENCES "fantasy_leagues"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fantasy_points" (
        "id"               SERIAL PRIMARY KEY,
        "fantasy_team_id"  integer      NOT NULL,
        "player_id"        integer      NOT NULL,
        "gameweek_id"      integer      NOT NULL,
        "points"           integer      NOT NULL DEFAULT 0,
        "breakdown"        jsonb        NOT NULL DEFAULT '{}',
        "created_at"       TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "FK_fantasy_points_team"
          FOREIGN KEY ("fantasy_team_id") REFERENCES "fantasy_teams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fantasy_points_gameweek"
          FOREIGN KEY ("gameweek_id") REFERENCES "fantasy_gameweeks"("id") ON DELETE CASCADE
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_fantasy_leagues_owner" ON "fantasy_leagues" ("owner_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_fantasy_teams_user"    ON "fantasy_teams"   ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_fantasy_teams_league"  ON "fantasy_teams"   ("fantasy_league_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_fantasy_rosters_team"  ON "fantasy_rosters" ("fantasy_team_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_fantasy_points_team"   ON "fantasy_points"  ("fantasy_team_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_fantasy_points_gw"     ON "fantasy_points"  ("gameweek_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fantasy_points"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fantasy_gameweeks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fantasy_rosters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fantasy_teams"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fantasy_leagues"`);
  }
}
