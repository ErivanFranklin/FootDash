import { IsOptional, IsString, IsNumber, MinLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RegisterNotificationTokenDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(50, { message: 'token is too short or malformed' })
  token!: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;
}
