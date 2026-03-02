import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOddsTable1772446850000 implements MigrationInterface {
  name = 'CreateOddsTable1772446850000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "odds" (
        "id"          SERIAL PRIMARY KEY,
        "match_id"    integer      NOT NULL DEFAULT 0,
        "home_team"   varchar(100),
        "away_team"   varchar(100),
        "match_date"  date,
        "bookmaker"   varchar(100) NOT NULL,
        "home_win"    decimal(5,2) NOT NULL,
        "draw"        decimal(5,2) NOT NULL,
        "away_win"    decimal(5,2) NOT NULL,
        "over25"      decimal(5,2),
        "under25"     decimal(5,2),
        "btts_yes"    decimal(5,2),
        "btts_no"     decimal(5,2),
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP    NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_odds_match_id"   ON "odds" ("match_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_odds_match_date" ON "odds" ("match_date" ASC)`);
    await queryRunner.query(`CREATE INDEX "IDX_odds_bookmaker"  ON "odds" ("bookmaker")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "odds"`);
  }
}
