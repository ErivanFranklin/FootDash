import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
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
  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @ApiProperty({
    description: 'One-time 2FA recovery code',
    example: 'AB12-CD34',
    required: false,
  })
  @IsOptional()
  @IsString()
  recoveryCode?: string;
}
