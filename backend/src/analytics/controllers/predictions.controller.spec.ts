import { Test, TestingModule } from '@nestjs/testing';

import { PredictionsController } from './predictions.controller';
import { MatchPredictionService } from '../services/match-prediction.service';
import { PredictionStrategyService } from '../services/prediction-strategy.service';
import { MLPredictionService } from '../services/ml-prediction.service';

describe('PredictionsController', () => {
  let controller: PredictionsController;

  const predictionServiceMock = {
    getUpcomingPredictions: jest.fn(),
  };
  const strategyServiceMock = {
    getPrediction: jest.fn(),
    getPredictionStats: jest.fn(),
  };
  const mlPredictionServiceMock = {
    checkMLServiceHealth: jest.fn(),
    getMLServiceInfo: jest.fn(),
    getModelMetrics: jest.fn(),
    predictBtts: jest.fn(),
    predictOverUnder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictionsController],
      providers: [
        { provide: MatchPredictionService, useValue: predictionServiceMock },
        { provide: PredictionStrategyService, useValue: strategyServiceMock },
        { provide: MLPredictionService, useValue: mlPredictionServiceMock },
      ],
    }).compile();

    controller = module.get<PredictionsController>(PredictionsController);
    jest.clearAllMocks();
  });

  it('delegates match prediction and force generation', async () => {
    strategyServiceMock.getPrediction.mockResolvedValue({ ok: true });

    await controller.getMatchPrediction(10, true);
    await controller.generatePrediction(10);

    expect(strategyServiceMock.getPrediction).toHaveBeenNthCalledWith(1, 10, true);
    expect(strategyServiceMock.getPrediction).toHaveBeenNthCalledWith(2, 10, true);
  });

  it('delegates upcoming and stats endpoints', async () => {
    predictionServiceMock.getUpcomingPredictions.mockResolvedValue([]);
    strategyServiceMock.getPredictionStats.mockResolvedValue({});

    await controller.getUpcomingPredictions(7);
    await controller.getPredictionStats('ml', 12);

    expect(predictionServiceMock.getUpcomingPredictions).toHaveBeenCalledWith(7);
    expect(strategyServiceMock.getPredictionStats).toHaveBeenCalledWith('ml', 12);
  });

  it('returns healthy ml status with info', async () => {
    mlPredictionServiceMock.checkMLServiceHealth.mockResolvedValue(true);
    mlPredictionServiceMock.getMLServiceInfo.mockResolvedValue({ version: '1' });

    await expect(controller.getMLHealth()).resolves.toEqual({
      status: 'healthy',
      info: { version: '1' },
    });
  });

  it('returns unavailable ml status without info', async () => {
    mlPredictionServiceMock.checkMLServiceHealth.mockResolvedValue(false);

    await expect(controller.getMLHealth()).resolves.toEqual({
      status: 'unavailable',
      info: null,
    });
    expect(mlPredictionServiceMock.getMLServiceInfo).not.toHaveBeenCalled();
  });

  it('builds BTTS payload with defaults when stats are missing', async () => {
    strategyServiceMock.getPrediction.mockResolvedValue({});
    mlPredictionServiceMock.predictBtts.mockResolvedValue({ result: 'yes' });

    await controller.getBttsPrediction(15);

    expect(mlPredictionServiceMock.predictBtts).toHaveBeenCalledWith(
      expect.objectContaining({
        home_goals_avg: 1.2,
        away_goals_avg: 1,
        league_id: 39,
      }),
    );
  });

  it('builds over-under payload and respects explicit line', async () => {
    strategyServiceMock.getPrediction.mockResolvedValue({
      stats: {
        homeGoalsAvg: 2.1,
        awayGoalsAvg: 1.9,
        season: '2024',
      },
    });
    mlPredictionServiceMock.predictOverUnder.mockResolvedValue({ result: 'over' });

    await controller.getOverUnderPrediction(15, 3.5);

    expect(mlPredictionServiceMock.predictOverUnder).toHaveBeenCalledWith(
      expect.objectContaining({
        home_goals_avg: 2.1,
        away_goals_avg: 1.9,
        line: 3.5,
      }),
    );
  });
});
