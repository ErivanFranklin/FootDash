import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokens1740000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        "userId" integer,
        revoked boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_refresh_tokens_token ON refresh_tokens(token);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_refresh_tokens_token;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens";`);
  }
}
