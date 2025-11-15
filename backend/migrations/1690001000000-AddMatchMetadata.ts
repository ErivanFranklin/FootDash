import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchMetadata1690001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // If the matches table doesn't exist (e.g., older DB without migrations), create a minimal version
    const hasMatches = await queryRunner.hasTable('matches');

    if (!hasMatches) {
      // Create a compatible matches table with essential columns. Keep it minimal to avoid FK complexity.
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "matches" (
          id SERIAL PRIMARY KEY,
          "externalId" integer UNIQUE,
          "homeTeamId" integer,
          "awayTeamId" integer,
          "kickOff" TIMESTAMP,
          status VARCHAR(255),
          "homeScore" integer,
          "awayScore" integer
        );
      `);
    }

    // Add metadata columns if they don't exist. Using ALTER TABLE will work whether we created the table above or it existed already.
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "referee" VARCHAR(255);`);
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "venue" TEXT;`);
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "league" TEXT;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the added columns if they exist.
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "referee";`);
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "venue";`);
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "league";`);
    // Do not drop the whole table here to avoid destroying existing data; migrations that created the table should be responsible for dropping it.
  }
}
