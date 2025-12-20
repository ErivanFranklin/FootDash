import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleToUsers1703084800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['user', 'admin'],
        default: "'user'",
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'blocked_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'blocked_at');
    await queryRunner.dropColumn('users', 'role');
  }
}
