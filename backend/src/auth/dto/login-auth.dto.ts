import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginAuthDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 's3cr3t123',
  })
  @IsString()
  password!: string;

  @ApiProperty({
    description: 'TOTP code for users with 2FA enabled',
    example: '123456',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @ApiProperty({
    description: 'One-time 2FA recovery code',
    example: 'AB12-CD34',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  recoveryCode?: string;
}
