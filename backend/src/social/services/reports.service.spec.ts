import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Report, ReportReason, ReportTargetType } from '../entities/report.entity';

describe('ReportsService', () => {
  let service: ReportsService;

  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('creates and saves a report with reporter id', async () => {
    const dto = {
      targetType: ReportTargetType.COMMENT,
      targetId: 10,
      reason: ReportReason.SPAM,
      description: 'spam',
    };
    const created = { id: 1, reporterId: 5, ...dto };
    mockRepo.create.mockReturnValue(created);
    mockRepo.save.mockResolvedValue(created);

    const result = await service.createReport(5, dto as any);

    expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, reporterId: 5 });
    expect(result).toEqual(created);
  });

  it('gets all reports without isResolved filter', async () => {
    qb.getMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.getReports(undefined);

    expect(qb.where).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('gets reports with isResolved filter', async () => {
    qb.getMany.mockResolvedValue([{ id: 2, isResolved: true }]);

    const result = await service.getReports(true);

    expect(qb.where).toHaveBeenCalledWith('report.isResolved = :isResolved', {
      isResolved: true,
    });
    expect(result[0].id).toBe(2);
  });

  it('throws NotFoundException when resolving unknown report', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.resolveReport(99, 7)).rejects.toThrow(NotFoundException);
  });

  it('marks report as resolved and stores resolver metadata', async () => {
    const report = { id: 3, isResolved: false, resolvedById: null, resolvedAt: null };
    mockRepo.findOne.mockResolvedValue(report);
    mockRepo.save.mockImplementation(async (r: any) => r);

    const result = await service.resolveReport(3, 7);

    expect(result.isResolved).toBe(true);
    expect(result.resolvedById).toBe(7);
    expect(result.resolvedAt).toBeTruthy();
  });
});
