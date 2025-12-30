import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePredictionPerformanceTable1703000000000
  implements MigrationInterface
{
  name = 'CreatePredictionPerformanceTable1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'prediction_performance',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'match_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'model_type',
            type: 'enum',
            enum: ['statistical', 'ml', 'hybrid'],
            isNullable: false,
          },
          {
            name: 'prediction_data',
            type: 'json',
            isNullable: false,
            comment: 'Stores prediction probabilities: {homeWin, draw, awayWin}',
          },
          {
            name: 'actual_outcome',
            type: 'enum',
            enum: ['HOME_WIN', 'DRAW', 'AWAY_WIN'],
            isNullable: true,
            comment: 'Actual match result for accuracy calculation',
          },
          {
            name: 'was_correct',
            type: 'boolean',
            isNullable: true,
            comment: 'Whether the prediction was correct',
          },
          {
            name: 'confidence_score',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
            comment: 'Highest probability from the prediction',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Additional prediction metadata (model version, features, etc.)',
          },
          {
            name: 'predicted_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'evaluated_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When the prediction was evaluated against actual results',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'IDX_prediction_performance_match_id',
            columnNames: ['match_id'],
          },
          {
            name: 'IDX_prediction_performance_model_type',
            columnNames: ['model_type'],
          },
          {
            name: 'IDX_prediction_performance_predicted_at',
            columnNames: ['predicted_at'],
          },
          {
            name: 'IDX_prediction_performance_evaluated_at',
            columnNames: ['evaluated_at'],
          },
          {
            name: 'IDX_prediction_performance_type_evaluated',
            columnNames: ['model_type', 'evaluated_at'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('prediction_performance');
  }
}