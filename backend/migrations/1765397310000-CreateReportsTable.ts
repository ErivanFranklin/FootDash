import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReportsTable1765397310000 implements MigrationInterface {
    name = 'CreateReportsTable1765397310000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "reports_target_type_enum" AS ENUM('comment', 'user', 'prediction')`);
        await queryRunner.query(`CREATE TYPE "reports_reason_enum" AS ENUM('spam', 'harassment', 'inappropriate', 'hate_speech', 'other')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" SERIAL NOT NULL, "reporter_id" integer NOT NULL, "target_type" "reports_target_type_enum" NOT NULL, "target_id" integer NOT NULL, "reason" "reports_reason_enum" NOT NULL, "description" character varying(500), "is_resolved" boolean NOT NULL DEFAULT false, "resolved_by_id" integer, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_reports" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_reports_reporter_id" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_reports_resolved_by_id" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_resolved_by_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter_id"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "reports_reason_enum"`);
        await queryRunner.query(`DROP TYPE "reports_target_type_enum"`);
    }
}
