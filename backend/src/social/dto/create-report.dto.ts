import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportTargetType, ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty()
  @IsInt()
  targetId: number;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
