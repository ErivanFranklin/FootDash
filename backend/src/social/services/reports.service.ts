import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportTargetType } from '../entities/report.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import { User } from '../../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async createReport(reporterId: number, dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create({
      ...dto,
      reporterId,
    });
    return this.reportsRepository.save(report);
  }

  async getReports(isResolved?: boolean): Promise<Report[]> {
    const query = this.reportsRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .orderBy('report.createdAt', 'DESC');

    if (isResolved !== undefined) {
      query.where('report.isResolved = :isResolved', { isResolved });
    }

    return query.getMany();
  }

  async resolveReport(reportId: number, resolvedById: number): Promise<Report> {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    report.isResolved = true;
    report.resolvedById = resolvedById;
    report.resolvedAt = new Date();

    return this.reportsRepository.save(report);
  }
}
