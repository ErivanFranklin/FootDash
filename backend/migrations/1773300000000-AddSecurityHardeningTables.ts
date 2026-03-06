import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityHardeningTables1773300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "two_factor_secret" text,
      ADD COLUMN IF NOT EXISTS "two_factor_recovery_codes" text;
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN IF NOT EXISTS "ipAddress" varchar(64),
      ADD COLUMN IF NOT EXISTS "userAgent" text,
      ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMPTZ;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "login_audits" (
        id SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        email varchar(255) NOT NULL,
        "ipAddress" varchar(64),
        "userAgent" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_login_audits_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_login_audits_user_created" ON "login_audits" ("userId", "createdAt");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_login_audits_user_created";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_audits";`);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN IF EXISTS "lastUsedAt",
      DROP COLUMN IF EXISTS "userAgent",
      DROP COLUMN IF EXISTS "ipAddress";
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "two_factor_recovery_codes",
      DROP COLUMN IF EXISTS "two_factor_secret",
      DROP COLUMN IF EXISTS "two_factor_enabled";
    `);
  }
}
