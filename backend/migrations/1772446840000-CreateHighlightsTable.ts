import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHighlightsTable1772446840000 implements MigrationInterface {
  name = 'CreateHighlightsTable1772446840000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "highlights" (
        "id"           SERIAL PRIMARY KEY,
        "match_id"     integer       NOT NULL DEFAULT 0,
        "title"        varchar(300),
        "description"  text,
        "thumbnail_url" varchar(500),
        "video_url"    varchar(500)  NOT NULL,
        "source"       varchar(30)   NOT NULL DEFAULT 'youtube',
        "external_id"  varchar(100),
        "duration"     integer       NOT NULL DEFAULT 0,
        "view_count"   integer       NOT NULL DEFAULT 0,
        "home_team"    varchar(100),
        "away_team"    varchar(100),
        "match_date"   date,
        "created_at"   TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_highlights_external_id" UNIQUE ("external_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_highlights_match_id"    ON "highlights" ("match_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_highlights_match_date"  ON "highlights" ("match_date" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_highlights_external_id" ON "highlights" ("external_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "highlights"`);
  }
}
