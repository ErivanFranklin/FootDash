import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePasswordResetTokens1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'tokenHash', type: 'text' },
          { name: 'userId', type: 'int' },
          { name: 'expiresAt', type: 'timestamptz' },
          { name: 'usedAt', type: 'timestamptz', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
}
