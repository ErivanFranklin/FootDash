import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayersTable1773200000000 implements MigrationInterface {
  name = 'CreatePlayersTable1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "players" (
        "id"          SERIAL PRIMARY KEY,
        "external_id" integer UNIQUE,
        "name"        varchar(120) NOT NULL,
        "position"    varchar(5)   NOT NULL,
        "team_name"   varchar(80)  NOT NULL,
        "price"       decimal(8,2) NOT NULL DEFAULT 5.00,
        "form"        integer      NOT NULL DEFAULT 60,
        "is_active"   boolean      NOT NULL DEFAULT true,
        "created_at"  timestamp    NOT NULL DEFAULT now(),
        "updated_at"  timestamp    NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_players_position" ON "players" ("position")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_players_price" ON "players" ("price")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_players_active" ON "players" ("is_active")`);

    await queryRunner.query(`
      INSERT INTO "players" ("external_id", "name", "position", "team_name", "price", "form", "is_active") VALUES
        (10001, 'Alisson Becker', 'GK', 'Liverpool', 6.0, 78, true),
        (10002, 'Jordan Pickford', 'GK', 'Everton', 5.2, 70, true),
        (10003, 'Ederson', 'GK', 'Man City', 5.8, 75, true),
        (10101, 'Trent Alexander-Arnold', 'DEF', 'Liverpool', 7.8, 82, true),
        (10102, 'Virgil van Dijk', 'DEF', 'Liverpool', 6.5, 79, true),
        (10103, 'William Saliba', 'DEF', 'Arsenal', 6.0, 77, true),
        (10104, 'Ruben Dias', 'DEF', 'Man City', 6.1, 74, true),
        (10105, 'Pedro Porro', 'DEF', 'Spurs', 5.6, 73, true),
        (10201, 'Bukayo Saka', 'MID', 'Arsenal', 9.4, 84, true),
        (10202, 'Phil Foden', 'MID', 'Man City', 8.7, 83, true),
        (10203, 'Cole Palmer', 'MID', 'Chelsea', 8.5, 82, true),
        (10204, 'Bruno Fernandes', 'MID', 'Man Utd', 8.2, 76, true),
        (10205, 'James Maddison', 'MID', 'Spurs', 7.6, 75, true),
        (10206, 'Martin Odegaard', 'MID', 'Arsenal', 8.1, 79, true),
        (10301, 'Erling Haaland', 'FWD', 'Man City', 14.2, 86, true),
        (10302, 'Mohamed Salah', 'FWD', 'Liverpool', 13.4, 85, true),
        (10303, 'Ollie Watkins', 'FWD', 'Aston Villa', 9.1, 80, true),
        (10304, 'Dominic Solanke', 'FWD', 'Bournemouth', 7.4, 73, true),
        (10305, 'Darwin Nunez', 'FWD', 'Liverpool', 7.8, 71, true)
      ON CONFLICT ("external_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "players"');
  }
}
