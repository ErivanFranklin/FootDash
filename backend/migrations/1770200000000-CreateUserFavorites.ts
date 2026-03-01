import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserFavorites1770200000000 implements MigrationInterface {
  name = 'CreateUserFavorites1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_favorites" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "entity_type" varchar(20) NOT NULL,
        "entity_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_favorites_user_entity" UNIQUE ("user_id", "entity_type", "entity_id"),
        CONSTRAINT "FK_user_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_favorites_user_id" ON "user_favorites" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_favorites_entity" ON "user_favorites" ("entity_type", "entity_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_favorites"`);
  }
}
