import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaguesTable1772446830000 implements MigrationInterface {
  name = 'CreateLeaguesTable1772446830000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leagues" (
        "id"           SERIAL PRIMARY KEY,
        "external_id"  integer,
        "name"         varchar(100) NOT NULL,
        "country"      varchar(60),
        "logo"         varchar(500),
        "season"       varchar(10),
        "type"         varchar(30),
        "is_featured"  boolean     NOT NULL DEFAULT false,
        "last_sync_at" TIMESTAMP,
        "created_at"   TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_leagues_external_id" UNIQUE ("external_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_leagues_featured"    ON "leagues" ("is_featured")`);
    await queryRunner.query(`CREATE INDEX "IDX_leagues_country"     ON "leagues" ("country")`);
    await queryRunner.query(`CREATE INDEX "IDX_leagues_external_id" ON "leagues" ("external_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leagues"`);
  }
}
