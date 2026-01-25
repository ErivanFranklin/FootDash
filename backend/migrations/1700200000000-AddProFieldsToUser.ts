import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProFieldsToUser1700200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("users", new TableColumn({
            name: "is_pro",
            type: "boolean",
            default: false
        }));

        await queryRunner.addColumn("users", new TableColumn({
            name: "stripe_customer_id",
            type: "varchar",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("users", "stripe_customer_id");
        await queryRunner.dropColumn("users", "is_pro");
    }
}
