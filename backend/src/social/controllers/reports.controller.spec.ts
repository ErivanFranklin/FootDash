import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../services/reports.service';
import { ReportReason, ReportTargetType } from '../entities/report.entity';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    createReport: jest.fn(),
    getReports: jest.fn(),
    resolveReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    jest.clearAllMocks();
  });

  it('creates report with request user id', async () => {
    const dto = {
      targetType: ReportTargetType.COMMENT,
      targetId: 5,
      reason: ReportReason.SPAM,
      description: 'spam',
    };
    mockReportsService.createReport.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.createReport({ user: { sub: 12 } } as any, dto as any);

    expect(mockReportsService.createReport).toHaveBeenCalledWith(12, dto);
    expect(result.id).toBe(1);
  });

  it('returns report list with optional resolved filter', async () => {
    mockReportsService.getReports.mockResolvedValue([{ id: 1 }]);

    const result = await controller.getReports(true as any);

    expect(mockReportsService.getReports).toHaveBeenCalledWith(true);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('resolves report with route id and request user id', async () => {
    mockReportsService.resolveReport.mockResolvedValue({ id: 8, isResolved: true });

    const result = await controller.resolveReport(8, { user: { sub: 5 } } as any);

    expect(mockReportsService.resolveReport).toHaveBeenCalledWith(8, 5);
    expect(result.isResolved).toBe(true);
  });
});
