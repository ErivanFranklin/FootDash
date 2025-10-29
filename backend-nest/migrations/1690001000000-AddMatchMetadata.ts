import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchMetadata1690001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Use TEXT columns for JSON payloads to remain compatible across sqlite and Postgres.
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "referee" VARCHAR(255);`);
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "venue" TEXT;`);
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "league" TEXT;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "referee";`);
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "venue";`);
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "league";`);
  }
}
