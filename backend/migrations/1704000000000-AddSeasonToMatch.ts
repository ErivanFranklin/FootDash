import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSeasonToMatch1704000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'matches',
      new TableColumn({
        name: 'season',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('matches', 'season');
  }
}
