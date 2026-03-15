import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PredictionStrategyService, PredictionStrategy } from './prediction-strategy.service';
import { MatchPredictionService } from './match-prediction.service';
import { MLPredictionService } from './ml-prediction.service';
import { PredictionPerformance } from '../entities/prediction-performance.entity';

describe('PredictionStrategyService', () => {
  let service: PredictionStrategyService;
  let statisticalService: MatchPredictionService;
  let mlService: MLPredictionService;

  const mockPrediction = {
    matchId: 1,
    homeConfidence: 0.6,
    awayConfidence: 0.2,
    drawConfidence: 0.2,
    prediction: 'HOME_WIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionStrategyService,
        {
          provide: MatchPredictionService,
          useValue: {
            getPrediction: jest.fn().mockResolvedValue(mockPrediction),
          },
        },
        {
          provide: MLPredictionService,
          useValue: {
            checkMLServiceHealth: jest.fn().mockResolvedValue(true),
            prepareMLRequest: jest.fn().mockReturnValue({}),
            generateMLPrediction: jest.fn().mockResolvedValue({ HOME_WIN: 0.7, AWAY_WIN: 0.1, DRAW: 0.2 }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('statistical'),
          },
        },
        {
          provide: getRepositoryToken(PredictionPerformance),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<PredictionStrategyService>(PredictionStrategyService);
    statisticalService = module.get<MatchPredictionService>(MatchPredictionService);
    mlService = module.get<MLPredictionService>(MLPredictionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrediction', () => {
    it('should use statistical strategy when configured', async () => {
      const result = await service.getPrediction(1);
      expect(statisticalService.getPrediction).toHaveBeenCalled();
      expect(result).toEqual(mockPrediction);
    });

    it('should fall back to statistical if ML fails', async () => {
      // Mock ML failure
      jest.spyOn(service as any, 'determineStrategy').mockReturnValue(PredictionStrategy.ML);
      (mlService.checkMLServiceHealth as jest.Mock).mockResolvedValue(false);
      
      const result = await service.getPrediction(1);
      
      expect(statisticalService.getPrediction).toHaveBeenCalled();
      expect(result).toEqual(mockPrediction);
    });

    it('should use ML strategy when determined', async () => {
      jest.spyOn(service as any, 'determineStrategy').mockReturnValue(PredictionStrategy.ML);
      (statisticalService as any).getMatchDataForPrediction = jest.fn().mockResolvedValue({ match: { id: 1 } });
      
      const result = await service.getPrediction(1);
      
      expect(mlService.generateMLPrediction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should use HYBRID strategy when determined', async () => {
        jest.spyOn(service as any, 'determineStrategy').mockReturnValue(PredictionStrategy.HYBRID);
        (statisticalService as any).getMatchDataForPrediction = jest.fn().mockResolvedValue({ match: { id: 1 } });
        
        const result = await service.getPrediction(1);
        
        expect(result).toBeDefined();
    });
  });

  describe('Private methods coverage', () => {
      it('determineStrategy should respect config', () => {
          const strategy = (service as any).determineStrategy(1);
          expect(strategy).toBe(PredictionStrategy.STATISTICAL);
      });
  });
});
