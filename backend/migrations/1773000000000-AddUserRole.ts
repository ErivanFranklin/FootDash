import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserRole1773000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'varchar',
        isNullable: false,
        default: `'USER'`,
      }),
    );

    await queryRunner.query(`UPDATE users SET role = 'USER' WHERE role IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'role');
  }
}
