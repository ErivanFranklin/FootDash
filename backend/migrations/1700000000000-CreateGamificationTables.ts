import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGamificationTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Badges
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "badges" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "description" VARCHAR NOT NULL,
        "icon_url" VARCHAR NOT NULL,
        "slug" VARCHAR NOT NULL UNIQUE
      );
    `);

    // User Badges (Join Table)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_badges" (
        "badge_id" INT NOT NULL REFERENCES "badges"("id") ON DELETE CASCADE,
        "user_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        PRIMARY KEY ("badge_id", "user_id")
      );
    `);

    // User Predictions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_predictions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "match_id" INT NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
        "home_score" INT NOT NULL,
        "away_score" INT NOT NULL,
        "points" INT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Leaderboards
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leaderboards" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "points" INT NOT NULL DEFAULT 0,
        "rank" INT NOT NULL,
        "period" VARCHAR NOT NULL,
        "period_identifier" VARCHAR NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leaderboards";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_predictions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_badges";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "badges";`);
  }
}
