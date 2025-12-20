import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAlertsTable1703084900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'alerts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'alertType',
            type: 'enum',
            enum: ['follower', 'reaction', 'comment', 'mention', 'system'],
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'actionUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'relatedUserId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'relatedEntityType',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'relatedEntityId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['relatedUserId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'alerts',
      new TableIndex({
        columnNames: ['userId', 'createdAt'],
        name: 'idx_alerts_user_created',
      }),
    );

    await queryRunner.createIndex(
      'alerts',
      new TableIndex({
        columnNames: ['userId', 'isRead'],
        name: 'idx_alerts_user_read',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('alerts');
  }
}
