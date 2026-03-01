import { IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token from the email link',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  @IsUUID()
  token!: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'NewStr0ng!Pass',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
