import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsTables1733857000000 implements MigrationInterface {
  name = 'AddAnalyticsTables1733857000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create prediction_confidence enum
    await queryRunner.query(`
      CREATE TYPE "match_predictions_confidence_enum" AS ENUM('low', 'medium', 'high')
    `);

    // Create match_predictions table
    await queryRunner.query(`
      CREATE TABLE "match_predictions" (
        "id" SERIAL NOT NULL,
        "match_id" integer NOT NULL,
        "home_win_probability" DECIMAL(5,2) NOT NULL,
        "draw_probability" DECIMAL(5,2) NOT NULL,
        "away_win_probability" DECIMAL(5,2) NOT NULL,
        "confidence" "match_predictions_confidence_enum" NOT NULL DEFAULT 'medium',
        "insights" json,
        "metadata" json,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_predictions" PRIMARY KEY ("id")
      )
    `);

    // Create team_analytics table
    await queryRunner.query(`
      CREATE TABLE "team_analytics" (
        "id" SERIAL NOT NULL,
        "team_id" integer NOT NULL,
        "season" character varying(20) NOT NULL,
        "form_rating" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "home_performance" json,
        "away_performance" json,
        "scoring_trend" json,
        "defensive_rating" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "overall_stats" json,
        "last_updated" TIMESTAMP,
        "calculated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_analytics" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_team_analytics_team_season" UNIQUE ("team_id", "season")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "match_predictions"
      ADD CONSTRAINT "FK_match_predictions_match_id"
      FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "team_analytics"
      ADD CONSTRAINT "FK_team_analytics_team_id"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_match_predictions_match_id" ON "match_predictions" ("match_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_team_analytics_team_id" ON "team_analytics" ("team_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_team_analytics_season" ON "team_analytics" ("season")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_team_analytics_team_season" ON "team_analytics" ("team_id", "season")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_team_analytics_team_season"`);
    await queryRunner.query(`DROP INDEX "IDX_team_analytics_season"`);
    await queryRunner.query(`DROP INDEX "IDX_team_analytics_team_id"`);
    await queryRunner.query(`DROP INDEX "IDX_match_predictions_match_id"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "team_analytics" DROP CONSTRAINT "FK_team_analytics_team_id"`);
    await queryRunner.query(`ALTER TABLE "match_predictions" DROP CONSTRAINT "FK_match_predictions_match_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "team_analytics"`);
    await queryRunner.query(`DROP TABLE "match_predictions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "match_predictions_confidence_enum"`);
  }
}
