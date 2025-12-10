import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndPreferences1733783250000 implements MigrationInterface {
  name = 'AddUserProfileAndPreferences1733783250000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_profiles table
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "display_name" character varying(50),
        "bio" character varying(500),
        "avatar_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
      )
    `);

    // Create user_preferences table
    await queryRunner.query(`
      CREATE TYPE "user_preferences_theme_enum" AS ENUM('light', 'dark', 'auto')
    `);

    await queryRunner.query(`
      CREATE TYPE "user_preferences_language_enum" AS ENUM('en', 'es', 'pt', 'fr')
    `);

    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "theme" "user_preferences_theme_enum" NOT NULL DEFAULT 'auto',
        "language" "user_preferences_language_enum" NOT NULL DEFAULT 'en',
        "notification_enabled" boolean NOT NULL DEFAULT true,
        "email_notifications" boolean NOT NULL DEFAULT true,
        "push_notifications" boolean NOT NULL DEFAULT true,
        "favorite_team_ids" json,
        "timezone" character varying(100),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_preferences_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD CONSTRAINT "FK_user_profiles_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD CONSTRAINT "FK_user_preferences_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_profiles_user_id" ON "user_profiles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_preferences_user_id" ON "user_preferences" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_user_preferences_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_user_profiles_user_id"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_user_preferences_user_id"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "user_preferences_language_enum"`);
    await queryRunner.query(`DROP TYPE "user_preferences_theme_enum"`);
  }
}
