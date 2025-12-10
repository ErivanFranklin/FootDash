import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSocialTables1765397309000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create comments table
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'match_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'prediction_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'parent_comment_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create reactions table
    await queryRunner.createTable(
      new Table({
        name: 'reactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'target_type',
            type: 'enum',
            enum: ['comment', 'prediction', 'match'],
            isNullable: false,
          },
          {
            name: 'target_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'reaction_type',
            type: 'enum',
            enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create follows table
    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'follower_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'following_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_activity table
    await queryRunner.createTable(
      new Table({
        name: 'user_activity',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'activity_type',
            type: 'enum',
            enum: ['comment', 'reaction', 'prediction', 'follow'],
            isNullable: false,
          },
          {
            name: 'target_type',
            type: 'enum',
            enum: ['match', 'prediction', 'comment', 'user'],
            isNullable: false,
          },
          {
            name: 'target_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for comments
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['match_id'],
        referencedTableName: 'matches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['prediction_id'],
        referencedTableName: 'match_predictions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['parent_comment_id'],
        referencedTableName: 'comments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for reactions
    await queryRunner.createForeignKey(
      'reactions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for follows
    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['follower_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['following_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for user_activity
    await queryRunner.createForeignKey(
      'user_activity',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for comments
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_MATCH_ID',
        columnNames: ['match_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_PREDICTION_ID',
        columnNames: ['prediction_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_PARENT_ID',
        columnNames: ['parent_comment_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    // Create unique index for reactions (one reaction per user per target)
    await queryRunner.createIndex(
      'reactions',
      new TableIndex({
        name: 'IDX_REACTIONS_UNIQUE',
        columnNames: ['user_id', 'target_type', 'target_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'reactions',
      new TableIndex({
        name: 'IDX_REACTIONS_TARGET',
        columnNames: ['target_type', 'target_id'],
      }),
    );

    // Create unique index for follows (can't follow same user twice)
    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_FOLLOWS_UNIQUE',
        columnNames: ['follower_id', 'following_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_FOLLOWS_FOLLOWER',
        columnNames: ['follower_id'],
      }),
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_FOLLOWS_FOLLOWING',
        columnNames: ['following_id'],
      }),
    );

    // Create indexes for user_activity
    await queryRunner.createIndex(
      'user_activity',
      new TableIndex({
        name: 'IDX_USER_ACTIVITY_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity',
      new TableIndex({
        name: 'IDX_USER_ACTIVITY_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity',
      new TableIndex({
        name: 'IDX_USER_ACTIVITY_TARGET',
        columnNames: ['target_type', 'target_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.dropTable('user_activity', true);
    await queryRunner.dropTable('follows', true);
    await queryRunner.dropTable('reactions', true);
    await queryRunner.dropTable('comments', true);
  }
}
