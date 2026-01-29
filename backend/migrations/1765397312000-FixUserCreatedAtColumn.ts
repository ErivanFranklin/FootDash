import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserCreatedAtColumn1765397312000 implements MigrationInterface {
    name = 'FixUserCreatedAtColumn1765397312000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the column exists with the wrong name 'createdAt'
        const table = await queryRunner.getTable("users");
        const wrongColumn = table?.findColumnByName("createdAt");
        const correctColumn = table?.findColumnByName("created_at");

        if (wrongColumn && !correctColumn) {
            await queryRunner.renameColumn("users", "createdAt", "created_at");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn("users", "created_at", "createdAt");
    }
}
