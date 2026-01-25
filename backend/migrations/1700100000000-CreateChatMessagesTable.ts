import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatMessagesTable1700100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" SERIAL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "match_id" integer NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    
    // Index for faster lookups by match and time
    await queryRunner.query(`CREATE INDEX "IDX_CHAT_MATCH" ON "chat_messages" ("match_id", "created_at" DESC);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_CHAT_MATCH";`);
    await queryRunner.query(`DROP TABLE "chat_messages";`);
  }
}
