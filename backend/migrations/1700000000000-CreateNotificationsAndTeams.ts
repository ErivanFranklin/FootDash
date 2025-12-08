import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsAndTeams1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_tokens" (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        "userId" integer,
        platform TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_tokens_token_idx ON notification_tokens(token);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teams" (
        id SERIAL PRIMARY KEY,
        "externalId" integer UNIQUE,
        name TEXT,
        "shortCode" TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS notification_tokens_token_idx;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_tokens";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teams";`);
  }
}
